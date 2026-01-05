use global_hotkey::{
    hotkey::{Code, HotKey, Modifiers},
    GlobalHotKeyManager,
};

pub struct HotkeyManager {
    manager: GlobalHotKeyManager,
    current_hotkey: Option<HotKey>,
}

impl HotkeyManager {
    pub fn new() -> Result<Self, String> {
        let manager = GlobalHotKeyManager::new()
            .map_err(|e| format!("Failed to create hotkey manager: {}", e))?;

        Ok(Self {
            manager,
            current_hotkey: None,
        })
    }

    pub fn parse_hotkey(hotkey_str: &str) -> Result<HotKey, String> {
        let parts: Vec<&str> = hotkey_str.split('+').collect();

        if parts.is_empty() {
            return Err("Empty hotkey string".to_string());
        }

        let mut modifiers = Modifiers::empty();
        let mut key_code = None;

        for part in parts {
            let part = part.trim();
            match part.to_lowercase().as_str() {
                "control" | "ctrl" => modifiers |= Modifiers::CONTROL,
                "shift" => modifiers |= Modifiers::SHIFT,
                "alt" => modifiers |= Modifiers::ALT,
                "meta" | "super" | "win" | "cmd" => modifiers |= Modifiers::META,
                "space" => key_code = Some(Code::Space),
                "enter" | "return" => key_code = Some(Code::Enter),
                "escape" | "esc" => key_code = Some(Code::Escape),
                "tab" => key_code = Some(Code::Tab),
                "backspace" => key_code = Some(Code::Backspace),
                "delete" => key_code = Some(Code::Delete),
                s if s.len() == 1 => {
                    let c = s.chars().next().unwrap().to_uppercase().next().unwrap();
                    key_code = Self::char_to_code(c);
                }
                s if s.starts_with('f') && s.len() <= 3 => {
                    if let Ok(num) = s[1..].parse::<u8>() {
                        key_code = Self::fkey_to_code(num);
                    }
                }
                _ => return Err(format!("Unknown key: {}", part)),
            }
        }

        let key_code = key_code.ok_or_else(|| "No key specified".to_string())?;

        Ok(HotKey::new(Some(modifiers), key_code))
    }

    fn char_to_code(c: char) -> Option<Code> {
        match c {
            'A' => Some(Code::KeyA),
            'B' => Some(Code::KeyB),
            'C' => Some(Code::KeyC),
            'D' => Some(Code::KeyD),
            'E' => Some(Code::KeyE),
            'F' => Some(Code::KeyF),
            'G' => Some(Code::KeyG),
            'H' => Some(Code::KeyH),
            'I' => Some(Code::KeyI),
            'J' => Some(Code::KeyJ),
            'K' => Some(Code::KeyK),
            'L' => Some(Code::KeyL),
            'M' => Some(Code::KeyM),
            'N' => Some(Code::KeyN),
            'O' => Some(Code::KeyO),
            'P' => Some(Code::KeyP),
            'Q' => Some(Code::KeyQ),
            'R' => Some(Code::KeyR),
            'S' => Some(Code::KeyS),
            'T' => Some(Code::KeyT),
            'U' => Some(Code::KeyU),
            'V' => Some(Code::KeyV),
            'W' => Some(Code::KeyW),
            'X' => Some(Code::KeyX),
            'Y' => Some(Code::KeyY),
            'Z' => Some(Code::KeyZ),
            '0' => Some(Code::Digit0),
            '1' => Some(Code::Digit1),
            '2' => Some(Code::Digit2),
            '3' => Some(Code::Digit3),
            '4' => Some(Code::Digit4),
            '5' => Some(Code::Digit5),
            '6' => Some(Code::Digit6),
            '7' => Some(Code::Digit7),
            '8' => Some(Code::Digit8),
            '9' => Some(Code::Digit9),
            _ => None,
        }
    }

    fn fkey_to_code(num: u8) -> Option<Code> {
        match num {
            1 => Some(Code::F1),
            2 => Some(Code::F2),
            3 => Some(Code::F3),
            4 => Some(Code::F4),
            5 => Some(Code::F5),
            6 => Some(Code::F6),
            7 => Some(Code::F7),
            8 => Some(Code::F8),
            9 => Some(Code::F9),
            10 => Some(Code::F10),
            11 => Some(Code::F11),
            12 => Some(Code::F12),
            _ => None,
        }
    }

    pub fn register(&mut self, hotkey_str: &str) -> Result<(), String> {
        if let Some(current) = self.current_hotkey.take() {
            let _ = self.manager.unregister(current);
        }

        let hotkey = Self::parse_hotkey(hotkey_str)?;

        self.manager
            .register(hotkey)
            .map_err(|e| format!("Failed to register hotkey: {}", e))?;

        self.current_hotkey = Some(hotkey);

        Ok(())
    }

    pub fn unregister(&mut self) -> Result<(), String> {
        if let Some(hotkey) = self.current_hotkey.take() {
            self.manager
                .unregister(hotkey)
                .map_err(|e| format!("Failed to unregister hotkey: {}", e))?;
        }
        Ok(())
    }

    pub fn current_hotkey_id(&self) -> Option<u32> {
        self.current_hotkey.map(|h| h.id())
    }
}
