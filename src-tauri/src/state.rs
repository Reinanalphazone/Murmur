use std::sync::{Arc, Mutex};
use crate::audio::RecordingHandle;
use crate::storage::database::Database;
use crate::stt::WhisperSTT;
use crate::llm::LlamaLLM;

pub struct AppState {
    pub recording_handle: Mutex<RecordingHandle>,
    pub database: Mutex<Database>,
    pub audio_levels: Arc<Mutex<Vec<f32>>>,
    pub whisper: Mutex<WhisperSTT>,
    pub llama: Mutex<LlamaLLM>,
}

impl AppState {
    pub fn new(database: Database) -> Self {
        let audio_levels = Arc::new(Mutex::new(vec![0.0; 32]));
        Self {
            recording_handle: Mutex::new(RecordingHandle::new(Arc::clone(&audio_levels))),
            database: Mutex::new(database),
            audio_levels,
            whisper: Mutex::new(WhisperSTT::new()),
            llama: Mutex::new(LlamaLLM::new()),
        }
    }
}
