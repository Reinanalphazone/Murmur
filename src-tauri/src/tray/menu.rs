use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    App, Emitter, Manager,
};

pub fn create_tray_menu(app: &App) -> Result<TrayIcon, Box<dyn std::error::Error>> {
    let toggle = MenuItem::with_id(app, "toggle", "Start Recording", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Murmur", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&toggle, &show, &quit])?;

    let tray = TrayIconBuilder::new()
        .menu(&menu)
        .tooltip("Murmur - Voice to Text")
        .icon(app.default_window_icon().cloned().unwrap())
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "quit" => {
                    app.exit(0);
                }
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "toggle" => {
                    // Emit to main window even if hidden
                    let _ = app.emit_to("main", "toggle-recording", ());
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            // Double-click on tray icon shows the window
            if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(tray)
}
