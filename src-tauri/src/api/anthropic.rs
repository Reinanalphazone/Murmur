use serde::{Deserialize, Serialize};

pub struct AnthropicProvider {
    api_key: String,
}

#[derive(Serialize)]
struct MessageRequest {
    model: String,
    max_tokens: u32,
    messages: Vec<Message>,
}

#[derive(Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct MessageResponse {
    content: Vec<ContentBlock>,
}

#[derive(Deserialize)]
struct ContentBlock {
    text: String,
}

impl AnthropicProvider {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }

    /// Clean up text using Claude API
    pub async fn cleanup(&self, text: &str, prompt: &str) -> Result<String, String> {
        let client = reqwest::Client::new();

        let request = MessageRequest {
            model: "claude-3-haiku-20240307".to_string(),
            max_tokens: 2048,
            messages: vec![Message {
                role: "user".to_string(),
                content: format!("{}\n\nText: {}", prompt, text),
            }],
        };

        let response = client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("API error: {}", error_text));
        }

        let result: MessageResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        result
            .content
            .first()
            .map(|c| c.text.clone())
            .ok_or_else(|| "No response from API".to_string())
    }
}
