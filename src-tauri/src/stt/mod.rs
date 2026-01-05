mod whisper;

pub use whisper::WhisperSTT;

/// Trait for Speech-to-Text providers
pub trait STTProvider: Send + Sync {
    fn transcribe(&self, audio_data: &[u8]) -> Result<String, String>;
    fn is_available(&self) -> bool;
}
