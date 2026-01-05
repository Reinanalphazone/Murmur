use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub hotkey: String,
    pub activation_mode: ActivationMode,
    pub paste_method: PasteMethod,
    pub cleanup_enabled: bool,
    pub cleanup_mode: CleanupMode,
    pub cleanup_prompt: String,
    pub auto_paste: bool,
    pub overlay_position: OverlayPosition,
    pub waveform_style: WaveformStyle,
    pub history_enabled: bool,
    pub auto_start: bool,
    pub stt_provider: String,
    pub llm_provider: String,
    pub selected_device: String,
    pub first_run_complete: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ActivationMode {
    Toggle,
    Hold,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PasteMethod {
    Clipboard,
    ClipboardRestore,
    Typing,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CleanupMode {
    Basic,
    Formal,
    Casual,
    Custom(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WaveformStyle {
    Bars,
    Wave,
    Circular,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum OverlayPosition {
    TopLeft,
    TopCenter,
    TopRight,
    BottomLeft,
    BottomCenter,
    BottomRight,
}

pub const DEFAULT_CLEANUP_PROMPT: &str = "You clean up transcribed speech. Output ONLY the cleaned text with no explanations, comments, or annotations. Remove filler words (um, uh, like, you know), fix grammar, and improve clarity while preserving the original meaning.";

impl Default for Settings {
    fn default() -> Self {
        Self {
            hotkey: "Control+Shift+Space".to_string(),
            activation_mode: ActivationMode::Toggle,
            paste_method: PasteMethod::Clipboard,
            cleanup_enabled: true,
            cleanup_mode: CleanupMode::Basic,
            cleanup_prompt: DEFAULT_CLEANUP_PROMPT.to_string(),
            auto_paste: true,
            overlay_position: OverlayPosition::BottomCenter,
            waveform_style: WaveformStyle::Bars,
            history_enabled: true,
            auto_start: false,
            stt_provider: "local".to_string(),
            llm_provider: "local".to_string(),
            selected_device: String::new(),
            first_run_complete: false,
        }
    }
}

impl Settings {
    pub fn from_db_rows(rows: Vec<(String, String)>) -> Self {
        let mut settings = Settings::default();

        for (key, value) in rows {
            match key.as_str() {
                "hotkey" => settings.hotkey = value,
                "activation_mode" => {
                    settings.activation_mode = match value.as_str() {
                        "hold" => ActivationMode::Hold,
                        _ => ActivationMode::Toggle,
                    }
                }
                "paste_method" => {
                    settings.paste_method = match value.as_str() {
                        "clipboard_restore" => PasteMethod::ClipboardRestore,
                        "typing" => PasteMethod::Typing,
                        _ => PasteMethod::Clipboard,
                    }
                }
                "cleanup_enabled" => settings.cleanup_enabled = value == "true",
                "cleanup_mode" => {
                    settings.cleanup_mode = match value.as_str() {
                        "formal" => CleanupMode::Formal,
                        "casual" => CleanupMode::Casual,
                        "basic" => CleanupMode::Basic,
                        other => CleanupMode::Custom(other.to_string()),
                    }
                }
                "cleanup_prompt" => settings.cleanup_prompt = value,
                "auto_paste" => settings.auto_paste = value == "true",
                "overlay_position" => {
                    settings.overlay_position = match value.as_str() {
                        "top_left" => OverlayPosition::TopLeft,
                        "top_center" => OverlayPosition::TopCenter,
                        "top_right" => OverlayPosition::TopRight,
                        "bottom_left" => OverlayPosition::BottomLeft,
                        "bottom_right" => OverlayPosition::BottomRight,
                        _ => OverlayPosition::BottomCenter,
                    }
                }
                "waveform_style" => {
                    settings.waveform_style = match value.as_str() {
                        "wave" => WaveformStyle::Wave,
                        "circular" => WaveformStyle::Circular,
                        _ => WaveformStyle::Bars,
                    }
                }
                "history_enabled" => settings.history_enabled = value == "true",
                "auto_start" => settings.auto_start = value == "true",
                "stt_provider" => settings.stt_provider = value,
                "llm_provider" => settings.llm_provider = value,
                "selected_device" => settings.selected_device = value,
                "first_run_complete" => settings.first_run_complete = value == "true",
                _ => {}
            }
        }

        settings
    }
}
