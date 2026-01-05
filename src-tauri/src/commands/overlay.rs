use tauri::{AppHandle, Emitter, Manager};
use serde::Serialize;

#[derive(Clone, Serialize)]
struct OverlayState {
    state: String,
}

#[derive(Clone, Serialize)]
struct OverlayLevels {
    levels: Vec<f32>,
}

#[tauri::command]
pub fn show_overlay(app: AppHandle, position: Option<String>) -> Result<(), String> {
    let overlay = app
        .get_webview_window("overlay")
        .ok_or("Overlay window not found")?;

    // Get primary monitor dimensions
    if let Some(monitor) = app.primary_monitor().map_err(|e| e.to_string())?.or_else(|| {
        app.available_monitors().ok().and_then(|m| m.into_iter().next())
    }) {
        let monitor_size = monitor.size();
        let monitor_position = monitor.position();
        let scale_factor = monitor.scale_factor();

        let window_width = 280.0;
        let window_height = 70.0;
        let padding = 20.0;
        // Extra padding for bottom positions to stay above Windows taskbar (typically 40-48px)
        let taskbar_padding = 60.0;

        let position = position.unwrap_or_else(|| "bottom_center".to_string());

        let (x, y) = match position.as_str() {
            "top_left" => (
                monitor_position.x as f64 + padding,
                monitor_position.y as f64 + padding,
            ),
            "top_center" => (
                monitor_position.x as f64 + (monitor_size.width as f64 / scale_factor - window_width) / 2.0,
                monitor_position.y as f64 + padding,
            ),
            "top_right" => (
                monitor_position.x as f64 + monitor_size.width as f64 / scale_factor - window_width - padding,
                monitor_position.y as f64 + padding,
            ),
            "bottom_left" => (
                monitor_position.x as f64 + padding,
                monitor_position.y as f64 + monitor_size.height as f64 / scale_factor - window_height - taskbar_padding,
            ),
            "bottom_center" => (
                monitor_position.x as f64 + (monitor_size.width as f64 / scale_factor - window_width) / 2.0,
                monitor_position.y as f64 + monitor_size.height as f64 / scale_factor - window_height - taskbar_padding,
            ),
            "bottom_right" => (
                monitor_position.x as f64 + monitor_size.width as f64 / scale_factor - window_width - padding,
                monitor_position.y as f64 + monitor_size.height as f64 / scale_factor - window_height - taskbar_padding,
            ),
            _ => (
                monitor_position.x as f64 + (monitor_size.width as f64 / scale_factor - window_width) / 2.0,
                monitor_position.y as f64 + monitor_size.height as f64 / scale_factor - window_height - taskbar_padding,
            ),
        };

        overlay
            .set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }))
            .map_err(|e| format!("Failed to position overlay: {}", e))?;
    }

    overlay.show().map_err(|e| format!("Failed to show overlay: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn hide_overlay(app: AppHandle) -> Result<(), String> {
    let overlay = app
        .get_webview_window("overlay")
        .ok_or("Overlay window not found")?;

    overlay.hide().map_err(|e| format!("Failed to hide overlay: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn update_overlay_position(app: AppHandle, position: String) -> Result<(), String> {
    let overlay = app
        .get_webview_window("overlay")
        .ok_or("Overlay window not found")?;

    // Only reposition if visible
    if overlay.is_visible().unwrap_or(false) {
        show_overlay(app, Some(position))?;
    }

    Ok(())
}

#[tauri::command]
pub fn emit_overlay_state(app: AppHandle, state: String) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        overlay
            .emit("recording-state-changed", OverlayState { state })
            .map_err(|e| format!("Failed to emit state: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn emit_overlay_levels(app: AppHandle, levels: Vec<f32>) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        overlay
            .emit("audio-levels-changed", OverlayLevels { levels })
            .map_err(|e| format!("Failed to emit levels: {}", e))?;
    }
    Ok(())
}
