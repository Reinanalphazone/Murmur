use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;

pub struct Database {
    conn: Connection,
}

impl Database {
    /// Create or open database at the app data directory
    pub fn new() -> Result<Self, String> {
        let db_path = Self::get_database_path()?;

        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create database directory: {}", e))?;
        }

        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;

        let db = Self { conn };
        db.initialize_tables()?;

        Ok(db)
    }

    fn get_database_path() -> Result<PathBuf, String> {
        let data_dir = dirs::data_dir()
            .ok_or_else(|| "Could not find data directory".to_string())?;

        Ok(data_dir.join("murmur").join("murmur.db"))
    }

    fn initialize_tables(&self) -> Result<(), String> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        ).map_err(|e| format!("Failed to create settings table: {}", e))?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_text TEXT NOT NULL,
                cleaned_text TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        ).map_err(|e| format!("Failed to create history table: {}", e))?;

        // Insert default settings if they don't exist
        self.insert_default_settings()?;

        Ok(())
    }

    fn insert_default_settings(&self) -> Result<(), String> {
        let defaults = [
            ("hotkey", "Control+Shift+Space"),
            ("activation_mode", "toggle"),  // "toggle" or "hold"
            ("paste_method", "clipboard"),  // "clipboard", "clipboard_restore", "typing"
            ("cleanup_enabled", "true"),
            ("cleanup_mode", "basic"),  // "basic", "formal", "casual"
            ("waveform_style", "bars"),  // "bars", "wave", "circular"
            ("history_enabled", "true"),
            ("auto_start", "false"),
            ("stt_provider", "local"),  // "local" or API provider name
            ("llm_provider", "local"),  // "local" or API provider name
            ("selected_device", ""),  // Empty means default device
            ("first_run_complete", "false"),
        ];

        for (key, value) in defaults {
            self.conn.execute(
                "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
                [key, value],
            ).map_err(|e| format!("Failed to insert default setting: {}", e))?;
        }

        Ok(())
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, String> {
        let mut stmt = self.conn
            .prepare("SELECT value FROM settings WHERE key = ?1")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let result = stmt
            .query_row([key], |row| row.get(0))
            .ok();

        Ok(result)
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        self.conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            [key, value],
        ).map_err(|e| format!("Failed to set setting: {}", e))?;

        Ok(())
    }

    pub fn get_all_settings(&self) -> Result<Vec<(String, String)>, String> {
        let mut stmt = self.conn
            .prepare("SELECT key, value FROM settings")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let rows = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| format!("Failed to query settings: {}", e))?;

        let mut settings = Vec::new();
        for row in rows {
            settings.push(row.map_err(|e| format!("Failed to read row: {}", e))?);
        }

        Ok(settings)
    }

    pub fn add_history_entry(&self, original: &str, cleaned: Option<&str>) -> Result<i64, String> {
        self.conn.execute(
            "INSERT INTO history (original_text, cleaned_text) VALUES (?1, ?2)",
            [original, cleaned.unwrap_or("")],
        ).map_err(|e| format!("Failed to add history entry: {}", e))?;

        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_history(&self, limit: Option<i32>) -> Result<Vec<(i64, String, Option<String>, String)>, String> {
        let limit = limit.unwrap_or(100);
        let mut stmt = self.conn
            .prepare("SELECT id, original_text, cleaned_text, created_at FROM history ORDER BY created_at DESC LIMIT ?1")
            .map_err(|e| format!("Failed to prepare statement: {}", e))?;

        let rows = stmt
            .query_map([limit], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, String>(3)?,
                ))
            })
            .map_err(|e| format!("Failed to query history: {}", e))?;

        let mut history = Vec::new();
        for row in rows {
            history.push(row.map_err(|e| format!("Failed to read row: {}", e))?);
        }

        Ok(history)
    }

    pub fn clear_history(&self) -> Result<(), String> {
        self.conn.execute("DELETE FROM history", [])
            .map_err(|e| format!("Failed to clear history: {}", e))?;
        Ok(())
    }

    pub fn delete_history_entry(&self, id: i64) -> Result<(), String> {
        self.conn.execute("DELETE FROM history WHERE id = ?1", [id])
            .map_err(|e| format!("Failed to delete history entry: {}", e))?;
        Ok(())
    }
}
