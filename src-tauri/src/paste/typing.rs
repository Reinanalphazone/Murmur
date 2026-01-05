use enigo::{Enigo, Keyboard, Settings};
use std::thread;
use std::time::Duration;

/// Paste text by simulating typing each character
pub fn paste_via_typing(text: &str) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Failed to create enigo instance: {}", e))?;

    // Type the text character by character
    enigo.text(text)
        .map_err(|e| format!("Failed to type text: {}", e))?;

    Ok(())
}

/// Paste text by simulating typing with delays (slower but more compatible)
pub fn paste_via_typing_slow(text: &str, delay_ms: u64) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("Failed to create enigo instance: {}", e))?;

    for ch in text.chars() {
        enigo.text(&ch.to_string())
            .map_err(|e| format!("Failed to type character: {}", e))?;
        thread::sleep(Duration::from_millis(delay_ms));
    }

    Ok(())
}
