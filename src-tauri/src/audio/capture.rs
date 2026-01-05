use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::SampleFormat;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};

pub struct RecordingHandle {
    stop_signal: Arc<AtomicBool>,
    samples: Arc<Mutex<Vec<f32>>>,
    audio_levels: Arc<Mutex<Vec<f32>>>,
    sample_rate: Arc<Mutex<u32>>,
    channels: Arc<Mutex<u16>>,
    thread_handle: Option<JoinHandle<()>>,
}

unsafe impl Send for RecordingHandle {}
unsafe impl Sync for RecordingHandle {}

impl RecordingHandle {
    pub fn new(audio_levels: Arc<Mutex<Vec<f32>>>) -> Self {
        Self {
            stop_signal: Arc::new(AtomicBool::new(false)),
            samples: Arc::new(Mutex::new(Vec::new())),
            audio_levels,
            sample_rate: Arc::new(Mutex::new(44100)),
            channels: Arc::new(Mutex::new(1)),
            thread_handle: None,
        }
    }

    pub fn start(&mut self, device_name: Option<String>) -> Result<(), String> {
        if self.thread_handle.is_some() {
            return Err("Already recording".to_string());
        }

        {
            let mut samples = self.samples.lock().unwrap();
            samples.clear();
        }

        self.stop_signal.store(false, Ordering::SeqCst);

        let stop_signal = Arc::clone(&self.stop_signal);
        let samples = Arc::clone(&self.samples);
        let audio_levels = Arc::clone(&self.audio_levels);
        let sample_rate_arc = Arc::clone(&self.sample_rate);
        let channels_arc = Arc::clone(&self.channels);

        let handle = thread::spawn(move || {
            if let Err(e) = run_recording(
                device_name,
                stop_signal,
                samples,
                audio_levels,
                sample_rate_arc,
                channels_arc,
            ) {
                eprintln!("Recording error: {}", e);
            }
        });

        self.thread_handle = Some(handle);
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(Vec<f32>, u32, u16), String> {
        self.stop_signal.store(true, Ordering::SeqCst);

        if let Some(handle) = self.thread_handle.take() {
            handle.join().map_err(|_| "Failed to join recording thread".to_string())?;
        }

        let samples = self.samples.lock().unwrap().clone();
        let sample_rate = *self.sample_rate.lock().unwrap();
        let channels = *self.channels.lock().unwrap();

        Ok((samples, sample_rate, channels))
    }

    pub fn is_recording(&self) -> bool {
        self.thread_handle.is_some() && !self.stop_signal.load(Ordering::SeqCst)
    }
}

fn run_recording(
    device_name: Option<String>,
    stop_signal: Arc<AtomicBool>,
    samples: Arc<Mutex<Vec<f32>>>,
    audio_levels: Arc<Mutex<Vec<f32>>>,
    sample_rate_arc: Arc<Mutex<u32>>,
    channels_arc: Arc<Mutex<u16>>,
) -> Result<(), String> {
    let host = cpal::default_host();

    let device = match device_name {
        Some(ref name) => host
            .input_devices()
            .map_err(|e| format!("Failed to get devices: {}", e))?
            .find(|d| d.name().ok().as_deref() == Some(name))
            .ok_or_else(|| format!("Device not found: {}", name))?,
        None => host
            .default_input_device()
            .ok_or_else(|| "No default input device found".to_string())?,
    };

    let config = device
        .default_input_config()
        .map_err(|e| format!("Failed to get default config: {}", e))?;

    let sample_rate = config.sample_rate().0;
    let channels = config.channels();

    *sample_rate_arc.lock().unwrap() = sample_rate;
    *channels_arc.lock().unwrap() = channels;

    let err_fn = |err| eprintln!("Audio stream error: {}", err);

    let samples_clone = Arc::clone(&samples);
    let audio_levels_clone = Arc::clone(&audio_levels);

    let stream = match config.sample_format() {
        SampleFormat::F32 => {
            let mut level_buffer: Vec<f32> = Vec::new();
            device.build_input_stream(
                &config.into(),
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    let mut samples_lock = samples_clone.lock().unwrap();
                    for &sample in data.iter() {
                        samples_lock.push(sample);
                        level_buffer.push(sample.abs());
                    }

                    if level_buffer.len() >= 1024 {
                        let rms: f32 = (level_buffer.iter().map(|x| x * x).sum::<f32>()
                            / level_buffer.len() as f32).sqrt();

                        let mut levels = audio_levels_clone.lock().unwrap();
                        if !levels.is_empty() {
                            levels.remove(0);
                            levels.push(rms.min(1.0));
                        }
                        level_buffer.clear();
                    }
                },
                err_fn,
                None,
            )
        }
        SampleFormat::I16 => {
            let mut level_buffer: Vec<f32> = Vec::new();
            device.build_input_stream(
                &config.into(),
                move |data: &[i16], _: &cpal::InputCallbackInfo| {
                    let mut samples_lock = samples_clone.lock().unwrap();
                    for &sample in data.iter() {
                        let sample_f32 = sample as f32 / i16::MAX as f32;
                        samples_lock.push(sample_f32);
                        level_buffer.push(sample_f32.abs());
                    }

                    if level_buffer.len() >= 1024 {
                        let rms: f32 = (level_buffer.iter().map(|x| x * x).sum::<f32>()
                            / level_buffer.len() as f32).sqrt();

                        let mut levels = audio_levels_clone.lock().unwrap();
                        if !levels.is_empty() {
                            levels.remove(0);
                            levels.push(rms.min(1.0));
                        }
                        level_buffer.clear();
                    }
                },
                err_fn,
                None,
            )
        }
        _ => return Err("Unsupported sample format".to_string()),
    }.map_err(|e| format!("Failed to build input stream: {}", e))?;

    stream.play().map_err(|e| format!("Failed to start stream: {}", e))?;

    while !stop_signal.load(Ordering::SeqCst) {
        thread::sleep(std::time::Duration::from_millis(10));
    }

    drop(stream);
    Ok(())
}

pub fn samples_to_wav(samples: &[f32], sample_rate: u32, channels: u16) -> Result<Vec<u8>, String> {
    use std::io::Cursor;

    let spec = hound::WavSpec {
        channels,
        sample_rate,
        bits_per_sample: 16,
        sample_format: hound::SampleFormat::Int,
    };

    let mut cursor = Cursor::new(Vec::new());
    let mut writer = hound::WavWriter::new(&mut cursor, spec)
        .map_err(|e| format!("Failed to create WAV writer: {}", e))?;

    for &sample in samples {
        let sample_i16 = (sample * i16::MAX as f32) as i16;
        writer.write_sample(sample_i16)
            .map_err(|e| format!("Failed to write sample: {}", e))?;
    }

    writer.finalize()
        .map_err(|e| format!("Failed to finalize WAV: {}", e))?;

    Ok(cursor.into_inner())
}
