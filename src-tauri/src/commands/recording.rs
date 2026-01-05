use tauri::State;
use crate::state::AppState;
use crate::audio::samples_to_wav;

#[tauri::command]
pub fn start_recording(state: State<AppState>, device_name: Option<String>) -> Result<(), String> {
    let mut handle = state.recording_handle.lock().unwrap();
    handle.start(device_name)
}

#[tauri::command]
pub fn stop_recording(state: State<AppState>) -> Result<Vec<u8>, String> {
    let mut handle = state.recording_handle.lock().unwrap();
    let (samples, sample_rate, channels) = handle.stop()?;
    samples_to_wav(&samples, sample_rate, channels)
}

#[tauri::command]
pub fn is_recording(state: State<AppState>) -> bool {
    let handle = state.recording_handle.lock().unwrap();
    handle.is_recording()
}
