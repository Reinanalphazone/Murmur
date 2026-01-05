mod llama;
mod prompts;

pub use llama::LlamaLLM;
pub use prompts::CleanupPrompt;

/// Trait for LLM providers
pub trait LLMProvider: Send + Sync {
    fn cleanup(&self, text: &str, mode: &str, custom_prompt: Option<&str>) -> Result<String, String>;
    fn is_available(&self) -> bool;
}
