use tauri::State;
use crate::state::AppState;

#[tauri::command]
pub async fn transcribe_audio(state: State<'_, AppState>, audio_data: Vec<u8>) -> Result<String, String> {
    let stt = state.whisper.lock().unwrap();

    if !stt.is_available() {
        return Err("Whisper model not loaded. Please download and load the model first.".to_string());
    }

    stt.transcribe(&audio_data)
}

#[tauri::command]
pub fn cleanup_text(state: State<AppState>, text: String, mode: Option<String>, custom_prompt: Option<String>) -> Result<String, String> {
    let llm = state.llama.lock().unwrap();

    if !llm.is_available() {
        // If LLM is not available, just return the original text
        return Ok(text);
    }

    let mode = mode.unwrap_or_else(|| "basic".to_string());
    llm.cleanup(&text, &mode, custom_prompt.as_deref())
}

#[tauri::command]
pub fn is_whisper_loaded(state: State<AppState>) -> bool {
    let stt = state.whisper.lock().unwrap();
    stt.is_available()
}

#[tauri::command]
pub fn is_llm_loaded(state: State<AppState>) -> bool {
    let llm = state.llama.lock().unwrap();
    llm.is_available()
}

#[tauri::command]
pub fn load_whisper(state: State<AppState>) -> Result<(), String> {
    let mut stt = state.whisper.lock().unwrap();
    stt.load()
}

#[tauri::command]
pub fn load_llm(state: State<AppState>) -> Result<(), String> {
    let mut llm = state.llama.lock().unwrap();
    llm.load()
}

#[tauri::command]
pub fn is_whisper_downloaded() -> bool {
    crate::stt::WhisperSTT::is_model_downloaded()
}

#[tauri::command]
pub fn is_llm_downloaded() -> bool {
    crate::llm::LlamaLLM::is_model_downloaded()
}
