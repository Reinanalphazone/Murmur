use crate::paste::{paste_via_clipboard, paste_with_restore, paste_via_typing};

#[tauri::command]
pub fn paste_text(text: String, method: Option<String>) -> Result<(), String> {
    let method = method.unwrap_or_else(|| "clipboard".to_string());

    match method.as_str() {
        "clipboard_restore" => paste_with_restore(&text),
        "typing" => paste_via_typing(&text),
        _ => paste_via_clipboard(&text),
    }
}

#[tauri::command]
pub fn copy_to_clipboard(text: String) -> Result<(), String> {
    use arboard::Clipboard;

    let mut clipboard = Clipboard::new()
        .map_err(|e| format!("Failed to access clipboard: {}", e))?;

    clipboard.set_text(&text)
        .map_err(|e| format!("Failed to set clipboard text: {}", e))?;

    Ok(())
}
