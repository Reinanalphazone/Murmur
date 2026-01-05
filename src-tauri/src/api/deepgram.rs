use serde::Deserialize;

pub struct DeepgramProvider {
    api_key: String,
}

#[derive(Deserialize)]
struct DeepgramResponse {
    results: DeepgramResults,
}

#[derive(Deserialize)]
struct DeepgramResults {
    channels: Vec<DeepgramChannel>,
}

#[derive(Deserialize)]
struct DeepgramChannel {
    alternatives: Vec<DeepgramAlternative>,
}

#[derive(Deserialize)]
struct DeepgramAlternative {
    transcript: String,
}

impl DeepgramProvider {
    pub fn new(api_key: String) -> Self {
        Self { api_key }
    }

    /// Transcribe audio using Deepgram API
    pub async fn transcribe(&self, audio_data: Vec<u8>) -> Result<String, String> {
        let client = reqwest::Client::new();

        let response = client
            .post("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true")
            .header("Authorization", format!("Token {}", self.api_key))
            .header("Content-Type", "audio/wav")
            .body(audio_data)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(format!("API error: {}", error_text));
        }

        let result: DeepgramResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        result
            .results
            .channels
            .first()
            .and_then(|c| c.alternatives.first())
            .map(|a| a.transcript.clone())
            .ok_or_else(|| "No transcription result".to_string())
    }
}
