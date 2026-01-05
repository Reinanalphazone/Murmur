use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: i64,
    pub original_text: String,
    pub cleaned_text: Option<String>,
    pub created_at: String,
}

impl HistoryEntry {
    pub fn from_db_row(row: (i64, String, Option<String>, String)) -> Self {
        Self {
            id: row.0,
            original_text: row.1,
            cleaned_text: row.2,
            created_at: row.3,
        }
    }
}
