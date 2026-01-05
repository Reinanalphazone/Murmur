import { createSignal } from "solid-js";
import { Settings, getSettings, setSetting as setSettingApi } from "../lib/tauri";

const defaultSettings: Settings = {
  hotkey: "Control+Shift+Space",
  activation_mode: "toggle",
  paste_method: "clipboard",
  cleanup_enabled: true,
  cleanup_mode: "basic",
  cleanup_prompt: "You clean up transcribed speech. Output ONLY the cleaned text - no explanations, no commentary, no annotations. Remove filler words (um, uh, like, you know), fix grammar, and improve clarity while preserving meaning.",
  auto_paste: true,
  overlay_position: "bottom_center",
  waveform_style: "bars",
  history_enabled: true,
  auto_start: false,
  stt_provider: "local",
  llm_provider: "local",
  selected_device: "",
  first_run_complete: false,
};

const [settings, setSettings] = createSignal<Settings>(defaultSettings);
const [isLoading, setIsLoading] = createSignal(true);

export function useSettings() {
  return {
    settings,
    isLoading,

    async loadSettings() {
      try {
        setIsLoading(true);
        const loaded = await getSettings();
        setSettings(loaded);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    },

    async updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
      try {
        await setSettingApi(key, String(value));
        setSettings((prev) => ({ ...prev, [key]: value }));

        // Note: Hotkey changes require app restart to take effect
        if (key === "hotkey") {
          console.log("Hotkey updated. Restart the app for it to take effect.");
        }
      } catch (error) {
        console.error("Failed to update setting:", error);
        throw error;
      }
    },
  };
}
