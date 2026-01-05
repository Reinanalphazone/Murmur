use tauri::State;
use crate::state::AppState;
use crate::storage::{Settings, HistoryEntry};

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Result<Settings, String> {
    let db = state.database.lock().unwrap();
    let rows = db.get_all_settings()?;
    Ok(Settings::from_db_rows(rows))
}

#[tauri::command]
pub fn set_setting(state: State<AppState>, key: String, value: String) -> Result<(), String> {
    let db = state.database.lock().unwrap();
    db.set_setting(&key, &value)
}

#[tauri::command]
pub fn get_history(state: State<AppState>, limit: Option<i32>) -> Result<Vec<HistoryEntry>, String> {
    let db = state.database.lock().unwrap();
    let rows = db.get_history(limit)?;
    Ok(rows.into_iter().map(HistoryEntry::from_db_row).collect())
}

#[tauri::command]
pub fn clear_history(state: State<AppState>) -> Result<(), String> {
    let db = state.database.lock().unwrap();
    db.clear_history()
}

#[tauri::command]
pub fn delete_history_entry(state: State<AppState>, id: i64) -> Result<(), String> {
    let db = state.database.lock().unwrap();
    db.delete_history_entry(id)
}
