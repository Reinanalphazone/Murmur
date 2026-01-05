use super::LLMProvider;
use std::path::PathBuf;
use std::sync::Mutex;
use llama_cpp_2::context::params::LlamaContextParams;
use llama_cpp_2::llama_backend::LlamaBackend;
use llama_cpp_2::llama_batch::LlamaBatch;
use llama_cpp_2::model::{LlamaModel, AddBos, Special};
use llama_cpp_2::model::params::LlamaModelParams;
use llama_cpp_2::sampling::LlamaSampler;

/// Local LLM using llama.cpp
pub struct LlamaLLM {
    model: Mutex<Option<LlamaModel>>,
    backend: Option<LlamaBackend>,
}

// Safe to send between threads
unsafe impl Send for LlamaLLM {}
unsafe impl Sync for LlamaLLM {}

impl LlamaLLM {
    pub fn new() -> Self {
        Self {
            model: Mutex::new(None),
            backend: None,
        }
    }

    pub fn get_model_path() -> Result<PathBuf, String> {
        let data_dir =
            dirs::data_dir().ok_or_else(|| "Could not find data directory".to_string())?;
        Ok(data_dir
            .join("murmur")
            .join("models")
            .join("phi-3-mini-4k-instruct.Q4_K_M.gguf"))
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

        println!("Loading LLM model from: {:?}", model_path);

        // Initialize backend
        let backend = LlamaBackend::init().map_err(|e| format!("Failed to initialize llama backend: {:?}", e))?;

        // Load model
        let model_params = LlamaModelParams::default();
        let model = LlamaModel::load_from_file(&backend, model_path, &model_params)
            .map_err(|e| format!("Failed to load LLM model: {:?}", e))?;

        let mut guard = self.model.lock().unwrap();
        *guard = Some(model);

        println!("LLM model loaded successfully");
        Ok(())
    }

    pub fn cleanup(&self, text: &str, mode: &str, custom_prompt: Option<&str>) -> Result<String, String> {
        let mut guard = self.model.lock().unwrap();
        let model = guard.as_mut().ok_or("LLM model not loaded")?;

        // Create cleanup prompt based on mode
        let prompt = self.build_cleanup_prompt(text, mode, custom_prompt);

        // Create context
        let ctx_params = LlamaContextParams::default()
            .with_n_ctx(std::num::NonZeroU32::new(2048));

        let mut ctx = model.new_context(&LlamaBackend::init().unwrap(), ctx_params)
            .map_err(|e| format!("Failed to create context: {:?}", e))?;

        // Tokenize the prompt
        let tokens = model.str_to_token(&prompt, AddBos::Always)
            .map_err(|e| format!("Failed to tokenize: {:?}", e))?;

        let n_tokens = tokens.len();
        println!("LLM: Processing {} tokens", n_tokens);

        // Create batch and add tokens - only enable logits for last token
        let mut batch = LlamaBatch::new(512, 1);
        for (i, token) in tokens.iter().enumerate() {
            let is_last = i == tokens.len() - 1;
            batch.add(*token, i as i32, &[0], is_last)
                .map_err(|e| format!("Failed to add token to batch: {:?}", e))?;
        }

        ctx.decode(&mut batch)
            .map_err(|e| format!("Failed to decode prompt: {:?}", e))?;

        // Create sampler for greedy decoding
        let mut sampler = LlamaSampler::greedy();

        // Generate response
        let mut result = String::new();
        let max_tokens = 256;

        for i in 0..max_tokens {
            // Sample from the last token in the batch
            let new_token = sampler.sample(&ctx, batch.n_tokens() - 1);
            sampler.accept(new_token);

            // Check for end-of-generation
            if model.is_eog_token(new_token) {
                break;
            }

            let piece = model.token_to_str(new_token, Special::Tokenize)
                .map_err(|e| format!("Failed to convert token: {:?}", e))?;
            result.push_str(&piece);

            // Add token to batch for next iteration
            batch.clear();
            batch.add(new_token, (n_tokens + i) as i32, &[0], true)
                .map_err(|e| format!("Failed to add token: {:?}", e))?;

            ctx.decode(&mut batch)
                .map_err(|e| format!("Failed to decode: {:?}", e))?;
        }

        println!("LLM: Generated {} chars", result.len());

        Ok(result.trim().to_string())
    }

    fn build_cleanup_prompt(&self, text: &str, mode: &str, custom_prompt: Option<&str>) -> String {
        let system_prompt = match mode {
            "basic" => "You clean up transcribed speech. Output ONLY the cleaned text - no explanations, no commentary, no annotations. Remove filler words (um, uh, like, you know), fix grammar, and improve clarity while preserving meaning.",
            "formal" => "You are a professional editor. Output ONLY the transformed text - no explanations, no commentary, no annotations. Transform transcribed speech into formal, polished prose suitable for business communication.",
            "casual" => "You clean up transcribed speech. Output ONLY the cleaned text - no explanations, no commentary, no annotations. Fix grammar and remove filler words while keeping a casual, conversational tone.",
            "custom" => custom_prompt.unwrap_or("You clean up transcribed speech. Output ONLY the cleaned text - no explanations, no commentary, no annotations."),
            _ => "You clean up transcribed speech. Output ONLY the cleaned text - no explanations, no commentary, no annotations.",
        };

        format!(
            "<|system|>{}<|end|>\n<|user|>{}<|end|>\n<|assistant|>",
            system_prompt, text
        )
    }

    pub fn is_available(&self) -> bool {
        self.model.lock().unwrap().is_some()
    }
}

impl LLMProvider for LlamaLLM {
    fn cleanup(&self, text: &str, mode: &str, custom_prompt: Option<&str>) -> Result<String, String> {
        LlamaLLM::cleanup(self, text, mode, custom_prompt)
    }

    fn is_available(&self) -> bool {
        LlamaLLM::is_available(self)
    }
}
