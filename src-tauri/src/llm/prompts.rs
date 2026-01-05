/// Prompt templates for text cleanup
pub struct CleanupPrompt;

impl CleanupPrompt {
    /// Basic cleanup: remove filler words, fix grammar
    pub fn basic(text: &str) -> String {
        format!(
            r#"Clean up the following transcribed speech. Remove filler words (um, uh, like, you know), fix grammar and punctuation, but keep the original meaning and tone. Do not add any new information or change the meaning. Only output the cleaned text, nothing else.

Text: {}

Cleaned text:"#,
            text
        )
    }

    /// Formal mode: make text more professional
    pub fn formal(text: &str) -> String {
        format!(
            r#"Clean up the following transcribed speech and make it more formal and professional. Remove filler words, fix grammar, and adjust the tone to be suitable for professional communication. Keep the original meaning. Only output the cleaned text, nothing else.

Text: {}

Cleaned text:"#,
            text
        )
    }

    /// Casual mode: keep it conversational but clean
    pub fn casual(text: &str) -> String {
        format!(
            r#"Clean up the following transcribed speech while keeping a casual, friendly tone. Remove filler words and fix obvious errors, but keep contractions and conversational language. Only output the cleaned text, nothing else.

Text: {}

Cleaned text:"#,
            text
        )
    }

    /// Get prompt for the specified mode
    pub fn for_mode(text: &str, mode: &str) -> String {
        match mode {
            "formal" => Self::formal(text),
            "casual" => Self::casual(text),
            _ => Self::basic(text),
        }
    }
}
