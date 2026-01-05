use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub model_name: String,
    pub downloaded: u64,
    pub total: u64,
    pub percentage: f32,
}

pub struct ModelDownloader;

impl ModelDownloader {
    /// Get the models directory path
    pub fn get_models_dir() -> Result<PathBuf, String> {
        let data_dir = dirs::data_dir()
            .ok_or_else(|| "Could not find data directory".to_string())?;
        Ok(data_dir.join("murmur").join("models"))
    }

    /// Whisper model URL (base.en model, ~150MB)
    pub fn whisper_url() -> &'static str {
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"
    }

    /// Phi-3 Mini model URL (Q4_K_M quantization, ~2.4GB)
    pub fn phi3_url() -> &'static str {
        "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf"
    }

    /// Get Whisper model filename
    pub fn whisper_filename() -> &'static str {
        "ggml-base.en.bin"
    }

    /// Get Phi-3 model filename
    pub fn phi3_filename() -> &'static str {
        "phi-3-mini-4k-instruct.Q4_K_M.gguf"
    }

    /// Check if Whisper model is downloaded
    pub fn is_whisper_downloaded() -> bool {
        Self::get_models_dir()
            .map(|p| p.join(Self::whisper_filename()).exists())
            .unwrap_or(false)
    }

    /// Check if Phi-3 model is downloaded
    pub fn is_phi3_downloaded() -> bool {
        Self::get_models_dir()
            .map(|p| p.join(Self::phi3_filename()).exists())
            .unwrap_or(false)
    }

    /// Download Whisper model with progress callback
    pub async fn download_whisper<F>(progress_callback: F) -> Result<PathBuf, String>
    where
        F: Fn(DownloadProgress) + Send + 'static,
    {
        let models_dir = Self::get_models_dir()?;
        let dest_path = models_dir.join(Self::whisper_filename());

        Self::download_file(
            Self::whisper_url(),
            &dest_path,
            "Whisper Base (English)",
            progress_callback,
        ).await?;

        Ok(dest_path)
    }

    /// Download Phi-3 model with progress callback
    pub async fn download_phi3<F>(progress_callback: F) -> Result<PathBuf, String>
    where
        F: Fn(DownloadProgress) + Send + 'static,
    {
        let models_dir = Self::get_models_dir()?;
        let dest_path = models_dir.join(Self::phi3_filename());

        Self::download_file(
            Self::phi3_url(),
            &dest_path,
            "Phi-3 Mini 4K",
            progress_callback,
        ).await?;

        Ok(dest_path)
    }

    async fn download_file<F>(
        url: &str,
        dest_path: &PathBuf,
        model_name: &str,
        progress_callback: F,
    ) -> Result<(), String>
    where
        F: Fn(DownloadProgress) + Send + 'static,
    {
        // Ensure parent directory exists
        if let Some(parent) = dest_path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("Failed to create models directory: {}", e))?;
        }

        let client = reqwest::Client::new();
        let response = client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("Failed to start download: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Download failed with status: {}", response.status()));
        }

        let total_size = response.content_length().unwrap_or(0);

        let mut file = File::create(dest_path)
            .await
            .map_err(|e| format!("Failed to create file: {}", e))?;

        let mut downloaded: u64 = 0;
        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;

            file.write_all(&chunk)
                .await
                .map_err(|e| format!("Failed to write to file: {}", e))?;

            downloaded += chunk.len() as u64;

            let percentage = if total_size > 0 {
                (downloaded as f32 / total_size as f32) * 100.0
            } else {
                0.0
            };

            progress_callback(DownloadProgress {
                model_name: model_name.to_string(),
                downloaded,
                total: total_size,
                percentage,
            });
        }

        file.flush()
            .await
            .map_err(|e| format!("Failed to flush file: {}", e))?;

        Ok(())
    }
}
