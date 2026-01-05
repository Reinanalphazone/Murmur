use super::STTProvider;
use std::path::PathBuf;
use std::sync::Mutex;
use whisper_rs::{WhisperContext, WhisperContextParameters, FullParams, SamplingStrategy};

/// Local Whisper.cpp based STT
pub struct WhisperSTT {
    ctx: Mutex<Option<WhisperContext>>,
}

impl WhisperSTT {
    pub fn new() -> Self {
        Self {
            ctx: Mutex::new(None),
        }
    }

    pub fn get_model_path() -> Result<PathBuf, String> {
        let data_dir = dirs::data_dir()
            .ok_or_else(|| "Could not find data directory".to_string())?;
        Ok(data_dir.join("murmur").join("models").join("ggml-base.en.bin"))
    }

    pub fn is_model_downloaded() -> bool {
        Self::get_model_path()
            .map(|p| p.exists())
            .unwrap_or(false)
    }

    pub fn load(&mut self) -> Result<(), String> {
        let model_path = Self::get_model_path()?;

        if !model_path.exists() {
            return Err(format!("Model not found at {:?}. Please download the model first.", model_path));
        }

        // Canonicalize path to ensure proper Windows path format
        let model_path = model_path.canonicalize()
            .map_err(|e| format!("Failed to canonicalize model path: {}", e))?;

        // Convert to string, removing the \\?\ prefix that Windows adds
        let path_str = model_path.to_str()
            .ok_or("Invalid model path")?
            .trim_start_matches(r"\\?\");

        println!("Loading Whisper model from: {}", path_str);

        let ctx = WhisperContext::new_with_params(
            path_str,
            WhisperContextParameters::default(),
        ).map_err(|e| format!("Failed to load Whisper model: {}", e))?;

        let mut guard = self.ctx.lock().unwrap();
        *guard = Some(ctx);

        println!("Whisper model loaded successfully");
        Ok(())
    }

    pub fn transcribe(&self, audio_data: &[u8]) -> Result<String, String> {
        let guard = self.ctx.lock().unwrap();
        let ctx = guard.as_ref().ok_or("Whisper model not loaded")?;

        // Convert WAV bytes to PCM samples
        let reader = hound::WavReader::new(std::io::Cursor::new(audio_data))
            .map_err(|e| format!("Failed to read WAV data: {}", e))?;

        let spec = reader.spec();
        let source_sample_rate = spec.sample_rate;
        let source_channels = spec.channels;

        println!("Audio input: {}Hz, {} channels", source_sample_rate, source_channels);

        // Read all samples
        let samples_i16: Vec<i16> = reader
            .into_samples::<i16>()
            .filter_map(|s| s.ok())
            .collect();

        // Convert to mono if stereo
        let mono_samples: Vec<f32> = if source_channels == 2 {
            samples_i16
                .chunks(2)
                .map(|chunk| {
                    let left = chunk[0] as f32 / 32768.0;
                    let right = chunk.get(1).copied().unwrap_or(chunk[0]) as f32 / 32768.0;
                    (left + right) / 2.0
                })
                .collect()
        } else {
            samples_i16
                .iter()
                .map(|&s| s as f32 / 32768.0)
                .collect()
        };

        // Resample to 16kHz if needed (Whisper expects 16kHz)
        let target_sample_rate = 16000;
        let resampled = if source_sample_rate != target_sample_rate {
            Self::resample(&mono_samples, source_sample_rate, target_sample_rate)
        } else {
            mono_samples
        };

        println!("Resampled audio: {} samples at 16kHz", resampled.len());

        // Create transcription parameters
        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_n_threads(4);
        params.set_translate(false);
        params.set_language(Some("en"));
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);

        // Run transcription
        let mut state = ctx.create_state()
            .map_err(|e| format!("Failed to create whisper state: {}", e))?;

        state.full(params, &resampled)
            .map_err(|e| format!("Transcription failed: {}", e))?;

        // Get the transcribed text
        let num_segments = state.full_n_segments();

        let mut result = String::new();
        for i in 0..num_segments {
            if let Some(segment) = state.get_segment(i) {
                let text = segment.to_str()
                    .map_err(|e| format!("Failed to get segment text: {}", e))?;
                result.push_str(text);
                result.push(' ');
            }
        }

        Ok(result.trim().to_string())
    }

    pub fn is_available(&self) -> bool {
        self.ctx.lock().unwrap().is_some()
    }

    /// Simple linear interpolation resampling
    fn resample(samples: &[f32], from_rate: u32, to_rate: u32) -> Vec<f32> {
        if from_rate == to_rate {
            return samples.to_vec();
        }

        let ratio = from_rate as f64 / to_rate as f64;
        let new_len = (samples.len() as f64 / ratio) as usize;
        let mut resampled = Vec::with_capacity(new_len);

        for i in 0..new_len {
            let src_idx = i as f64 * ratio;
            let src_idx_floor = src_idx.floor() as usize;
            let src_idx_ceil = (src_idx_floor + 1).min(samples.len() - 1);
            let frac = src_idx - src_idx_floor as f64;

            let sample = samples[src_idx_floor] as f64 * (1.0 - frac)
                + samples[src_idx_ceil] as f64 * frac;
            resampled.push(sample as f32);
        }

        resampled
    }
}

impl STTProvider for WhisperSTT {
    fn transcribe(&self, audio_data: &[u8]) -> Result<String, String> {
        WhisperSTT::transcribe(self, audio_data)
    }

    fn is_available(&self) -> bool {
        WhisperSTT::is_available(self)
    }
}
