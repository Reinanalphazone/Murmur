use tauri::{AppHandle, Emitter};
use crate::models::{ModelDownloader, DownloadProgress};

#[tauri::command]
pub async fn download_whisper_model(app: AppHandle) -> Result<String, String> {
    let app_clone = app.clone();

    let path = ModelDownloader::download_whisper(move |progress: DownloadProgress| {
        let _ = app_clone.emit("download-progress", progress);
    }).await?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn download_llm_model(app: AppHandle) -> Result<String, String> {
    let app_clone = app.clone();

    let path = ModelDownloader::download_phi3(move |progress: DownloadProgress| {
        let _ = app_clone.emit("download-progress", progress);
    }).await?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_models_status() -> Result<ModelsStatus, String> {
    Ok(ModelsStatus {
        whisper_downloaded: ModelDownloader::is_whisper_downloaded(),
        llm_downloaded: ModelDownloader::is_phi3_downloaded(),
    })
}

#[derive(serde::Serialize)]
pub struct ModelsStatus {
    pub whisper_downloaded: bool,
    pub llm_downloaded: bool,
}
