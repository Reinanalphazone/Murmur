// Module declarations
mod audio;
mod commands;
mod state;
mod storage;
mod stt;
mod llm;
mod paste;
mod hotkey;
mod models;
mod api;
mod tray;

use state::AppState;
use storage::Database;
use hotkey::HotkeyManager;
use global_hotkey::GlobalHotKeyEvent;
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize the database
    let database = Database::new().expect("Failed to initialize database");

    // Load settings to get the hotkey
    let mut hotkey_str = database.get_setting("hotkey")
        .unwrap_or_else(|_| Some("Control+Shift+Space".to_string()))
        .unwrap_or_else(|| "Control+Shift+Space".to_string());

    // Initialize and register the hotkey
    // Note: On Windows, GlobalHotKeyManager contains raw pointers that aren't Send,
    // so we can't put it in AppState or manage it with Tauri's state management.
    // We register it once at startup and keep it alive for the lifetime of the app.
    let _hotkey_manager = HotkeyManager::new().expect("Failed to create hotkey manager");

    // SAFETY: We need to leak the hotkey manager to keep it alive for the app lifetime
    // This is necessary because HotkeyManager isn't Send on Windows
    let hotkey_manager = Box::leak(Box::new(_hotkey_manager));

    // Try to register the hotkey, if it fails with the stored value, reset to default
    if let Err(e) = hotkey_manager.register(&hotkey_str) {
        eprintln!("Failed to register hotkey '{}': {}", hotkey_str, e);
        eprintln!("Attempting to register default hotkey instead...");

        // Reset to default hotkey
        hotkey_str = "Control+Shift+Space".to_string();

        if let Err(e) = hotkey_manager.register(&hotkey_str) {
            eprintln!("Failed to register default hotkey: {}", e);
        } else {
            println!("Default hotkey registered: {}", hotkey_str);
            // Update database with working default
            let _ = database.set_setting("hotkey", &hotkey_str);
        }
    } else {
        println!("Global hotkey registered: {}", hotkey_str);
    }

    // Create the app state
    let app_state = AppState::new(database);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Audio commands
            commands::get_audio_devices,
            commands::get_audio_levels,
            // Recording commands
            commands::start_recording,
            commands::stop_recording,
            commands::is_recording,
            // Transcription commands
            commands::transcribe_audio,
            commands::cleanup_text,
            commands::is_whisper_loaded,
            commands::is_llm_loaded,
            commands::load_whisper,
            commands::load_llm,
            commands::is_whisper_downloaded,
            commands::is_llm_downloaded,
            // Model download commands
            commands::download_whisper_model,
            commands::download_llm_model,
            commands::get_models_status,
            // Settings commands
            commands::get_settings,
            commands::set_setting,
            // History commands
            commands::get_history,
            commands::clear_history,
            commands::delete_history_entry,
            // Paste commands
            commands::paste_text,
            commands::copy_to_clipboard,
            // Overlay commands
            commands::show_overlay,
            commands::hide_overlay,
            commands::update_overlay_position,
            commands::emit_overlay_state,
            commands::emit_overlay_levels,
        ])
        .setup(|app| {
            // Create the system tray
            let _tray = tray::create_tray_menu(app)?;

            // Set up global hotkey event listener
            let app_handle = app.handle().clone();

            std::thread::spawn(move || {
                let receiver = GlobalHotKeyEvent::receiver();
                loop {
                    if let Ok(_event) = receiver.recv() {
                        // Any hotkey event from our registered hotkey will come here
                        println!("Global hotkey pressed!");
                        // Emit event to main window (even if hidden)
                        if let Err(e) = app_handle.emit_to("main", "toggle-recording", ()) {
                            eprintln!("Failed to emit toggle-recording event: {}", e);
                        }
                    }
                }
            });

            // Hide main window on close instead of exiting (keep app running in tray)
            if let Some(main_window) = app.get_webview_window("main") {
                let app_handle = app.handle().clone();
                main_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        // Prevent the window from actually closing, just hide it
                        api.prevent_close();
                        if let Some(win) = app_handle.get_webview_window("main") {
                            let _ = win.hide();
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
