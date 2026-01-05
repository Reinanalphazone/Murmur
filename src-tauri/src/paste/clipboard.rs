use arboard::Clipboard;
use enigo::{Enigo, Key, Keyboard, Settings};
use std::thread;
use std::time::Duration;

/// Paste text using clipboard + keyboard shortcut
pub fn paste_via_clipboard(text: &str) -> Result<(), String> {
    let mut clipboard = Clipboard::new()
        .map_err(|e| format!("Failed to access clipboard: {}", e))?;

    clipboard.set_text(text)
        .map_err(|e| format!("Failed to set clipboard text: {}", e))?;

    // Small delay to ensure clipboard is set
    thread::sleep(Duration::from_millis(50));

    // Simulate Ctrl+V (or Cmd+V on macOS)
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Failed to create enigo instance: {}", e))?;

    #[cfg(target_os = "macos")]
    {
        enigo.key(Key::Meta, enigo::Direction::Press)
            .map_err(|e| format!("Failed to press key: {}", e))?;
        enigo.key(Key::Unicode('v'), enigo::Direction::Click)
            .map_err(|e| format!("Failed to press key: {}", e))?;
        enigo.key(Key::Meta, enigo::Direction::Release)
            .map_err(|e| format!("Failed to release key: {}", e))?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        enigo.key(Key::Control, enigo::Direction::Press)
            .map_err(|e| format!("Failed to press key: {}", e))?;
        enigo.key(Key::Unicode('v'), enigo::Direction::Click)
            .map_err(|e| format!("Failed to press key: {}", e))?;
        enigo.key(Key::Control, enigo::Direction::Release)
            .map_err(|e| format!("Failed to release key: {}", e))?;
    }

    Ok(())
}

/// Paste text using clipboard, then restore original clipboard contents
pub fn paste_with_restore(text: &str) -> Result<(), String> {
    let mut clipboard = Clipboard::new()
        .map_err(|e| format!("Failed to access clipboard: {}", e))?;

    // Save current clipboard contents
    let original = clipboard.get_text().ok();

    // Paste the new text
    paste_via_clipboard(text)?;

    // Wait for paste to complete
    thread::sleep(Duration::from_millis(100));

    // Restore original clipboard contents
    if let Some(original_text) = original {
        clipboard.set_text(&original_text)
            .map_err(|e| format!("Failed to restore clipboard: {}", e))?;
    }

    Ok(())
}
