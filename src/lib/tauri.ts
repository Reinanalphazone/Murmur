import { invoke } from "@tauri-apps/api/core";

// Types
export interface AudioDevice {
  name: string;
  is_default: boolean;
}

export type OverlayPosition = "top_left" | "top_center" | "top_right" | "bottom_left" | "bottom_center" | "bottom_right";

export interface Settings {
  hotkey: string;
  activation_mode: "toggle" | "hold";
  paste_method: "clipboard" | "clipboard_restore" | "typing";
  cleanup_enabled: boolean;
  cleanup_mode: "basic" | "formal" | "casual" | "custom" | string;
  cleanup_prompt: string;
  auto_paste: boolean;
  overlay_position: OverlayPosition;
  waveform_style: "bars" | "wave" | "circular";
  history_enabled: boolean;
  auto_start: boolean;
  stt_provider: string;
  llm_provider: string;
  selected_device: string;
  first_run_complete: boolean;
}

export interface HistoryEntry {
  id: number;
  original_text: string;
  cleaned_text: string | null;
  created_at: string;
}

// Audio commands
export async function getAudioDevices(): Promise<AudioDevice[]> {
  return invoke("get_audio_devices");
}

export async function getAudioLevels(): Promise<number[]> {
  return invoke("get_audio_levels");
}

// Recording commands
export async function startRecording(deviceName?: string): Promise<void> {
  return invoke("start_recording", { deviceName });
}

export async function stopRecording(): Promise<Uint8Array> {
  return invoke("stop_recording");
}

export async function isRecording(): Promise<boolean> {
  return invoke("is_recording");
}

// Transcription commands
export async function transcribeAudio(audioData: Uint8Array): Promise<string> {
  return invoke("transcribe_audio", { audioData: Array.from(audioData) });
}

export async function cleanupText(text: string, mode?: string, customPrompt?: string): Promise<string> {
  return invoke("cleanup_text", { text, mode, customPrompt });
}

export async function isWhisperLoaded(): Promise<boolean> {
  return invoke("is_whisper_loaded");
}

export async function isLlmLoaded(): Promise<boolean> {
  return invoke("is_llm_loaded");
}

export async function loadWhisper(): Promise<void> {
  return invoke("load_whisper");
}

export async function loadLlm(): Promise<void> {
  return invoke("load_llm");
}

// Settings commands
export async function getSettings(): Promise<Settings> {
  return invoke("get_settings");
}

export async function setSetting(key: string, value: string): Promise<void> {
  return invoke("set_setting", { key, value });
}

// History commands
export async function getHistory(limit?: number): Promise<HistoryEntry[]> {
  return invoke("get_history", { limit });
}

export async function clearHistory(): Promise<void> {
  return invoke("clear_history");
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  return invoke("delete_history_entry", { id });
}

// Paste commands
export async function pasteText(text: string, method?: string): Promise<void> {
  return invoke("paste_text", { text, method });
}

export async function copyToClipboard(text: string): Promise<void> {
  return invoke("copy_to_clipboard", { text });
}

// Overlay commands
export async function showOverlay(position?: OverlayPosition): Promise<void> {
  return invoke("show_overlay", { position });
}

export async function hideOverlay(): Promise<void> {
  return invoke("hide_overlay");
}

export async function updateOverlayPosition(position: OverlayPosition): Promise<void> {
  return invoke("update_overlay_position", { position });
}

export async function emitOverlayState(state: string): Promise<void> {
  return invoke("emit_overlay_state", { state });
}

export async function emitOverlayLevels(levels: number[]): Promise<void> {
  return invoke("emit_overlay_levels", { levels });
}
