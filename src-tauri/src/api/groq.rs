use serde::{Deserialize, Serialize};

pub struct GroqProvider {
    api_key: String,
}

#[derive(Deserialize)]
struct WhisperResponse {
    text: String,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: u32,
}

#[derive(Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

impl GroqProvider {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }

    /// Transcribe audio using Groq's Whisper API
    pub async fn transcribe(&self, audio_data: Vec<u8>) -> Result<String, String> {
        let client = reqwest::Client::new();

        let part = reqwest::multipart::Part::bytes(audio_data)
            .file_name("audio.wav")
            .mime_str("audio/wav")
            .map_err(|e| format!("Failed to create form part: {}", e))?;

        let form = reqwest::multipart::Form::new()
            .text("model", "whisper-large-v3")
            .part("file", part);

        let response = client
            .post("https://api.groq.com/openai/v1/audio/transcriptions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("API error: {}", error_text));
        }

        let result: WhisperResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(result.text)
    }

    /// Clean up text using Groq's LLM API
    pub async fn cleanup(&self, text: &str, prompt: &str) -> Result<String, String> {
        let client = reqwest::Client::new();

        let request = ChatRequest {
            model: "llama-3.1-8b-instant".to_string(),
            messages: vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: "You are a helpful assistant that cleans up transcribed speech.".to_string(),
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: format!("{}\n\nText: {}", prompt, text),
                },
            ],
            max_tokens: 2048,
        };

        let response = client
            .post("https://api.groq.com/openai/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("API error: {}", error_text));
        }

        let result: ChatResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        result
            .choices
            .first()
            .map(|c| c.message.content.clone())
            .ok_or_else(|| "No response from API".to_string())
    }
}
