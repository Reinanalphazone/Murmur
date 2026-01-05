use tauri::State;
use crate::state::AppState;
use crate::audio::{get_input_devices, AudioDevice};

#[tauri::command]
pub fn get_audio_devices() -> Result<Vec<AudioDevice>, String> {
    get_input_devices()
}

#[tauri::command]
pub fn get_audio_levels(state: State<AppState>) -> Vec<f32> {
    state.audio_levels.lock().unwrap().clone()
}
