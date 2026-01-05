import { Component, createSignal, onMount } from "solid-js";
import { useSettings } from "../../stores/settingsStore";

export const GeneralSettings: Component = () => {
  const { settings, updateSetting } = useSettings();
  const [hotkeyInput, setHotkeyInput] = createSignal("");
  const [isRecordingHotkey, setIsRecordingHotkey] = createSignal(false);

  onMount(() => {
    setHotkeyInput(settings().hotkey);
  });

  const handleHotkeyKeyDown = (e: KeyboardEvent) => {
    if (!isRecordingHotkey()) return;

    e.preventDefault();
    const parts: string[] = [];

    if (e.ctrlKey) parts.push("Control");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");
    if (e.metaKey) parts.push("Meta");

    const key = e.key;
    if (!["Control", "Shift", "Alt", "Meta"].includes(key)) {
      parts.push(key.length === 1 ? key.toUpperCase() : key);
    }

    if (parts.length > 0) {
      const hotkey = parts.join("+");
      setHotkeyInput(hotkey);

      // Only save if we have a non-modifier key
      if (!["Control", "Shift", "Alt", "Meta"].includes(key)) {
        setIsRecordingHotkey(false);
        updateSetting("hotkey", hotkey);
      }
    }
  };

  return (
    <div class="space-y-6">
      <h3 class="text-lg font-semibold">General Settings</h3>

      {/* Hotkey Configuration */}
      <div class="space-y-2">
        <label class="block text-sm font-medium text-text-muted">
          Activation Hotkey
        </label>
        <div class="flex gap-2">
          <input
            type="text"
            value={hotkeyInput()}
            onFocus={() => setIsRecordingHotkey(true)}
            onBlur={() => setIsRecordingHotkey(false)}
            onKeyDown={handleHotkeyKeyDown}
            readonly
            class={`flex-1 px-4 py-2 bg-background rounded-lg border transition-colors ${
              isRecordingHotkey()
                ? "border-primary ring-2 ring-primary/20"
                : "border-white/10"
            }`}
            placeholder="Click to record hotkey..."
          />
        </div>
        <p class="text-xs text-text-muted">
          {isRecordingHotkey()
            ? "Press your desired key combination..."
            : "Click the field and press a key combination"}
        </p>
      </div>

      {/* Activation Mode */}
      <div class="space-y-2">
        <label class="block text-sm font-medium text-text-muted">
          Activation Mode
        </label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="activation_mode"
              checked={settings().activation_mode === "toggle"}
              onChange={() => updateSetting("activation_mode", "toggle")}
              class="w-4 h-4 accent-primary"
            />
            <span>Toggle (press to start/stop)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="activation_mode"
              checked={settings().activation_mode === "hold"}
              onChange={() => updateSetting("activation_mode", "hold")}
              class="w-4 h-4 accent-primary"
            />
            <span>Hold (release to stop)</span>
          </label>
        </div>
      </div>

      {/* Paste Method */}
      <div class="space-y-2">
        <label class="block text-sm font-medium text-text-muted">
          Paste Method
        </label>
        <select
          value={settings().paste_method}
          onChange={(e) =>
            updateSetting(
              "paste_method",
              e.target.value as "clipboard" | "clipboard_restore" | "typing"
            )
          }
          class="w-full px-4 py-2 bg-background rounded-lg border border-white/10"
        >
          <option value="clipboard">Copy to clipboard</option>
          <option value="clipboard_restore">
            Copy to clipboard (restore previous)
          </option>
          <option value="typing">Type directly</option>
        </select>
      </div>

      {/* Waveform Style */}
      <div class="space-y-2">
        <label class="block text-sm font-medium text-text-muted">
          Waveform Style
        </label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="waveform_style"
              checked={settings().waveform_style === "bars"}
              onChange={() => updateSetting("waveform_style", "bars")}
              class="w-4 h-4 accent-primary"
            />
            <span>Bars</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="waveform_style"
              checked={settings().waveform_style === "wave"}
              onChange={() => updateSetting("waveform_style", "wave")}
              class="w-4 h-4 accent-primary"
            />
            <span>Wave</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="waveform_style"
              checked={settings().waveform_style === "circular"}
              onChange={() => updateSetting("waveform_style", "circular")}
              class="w-4 h-4 accent-primary"
            />
            <span>Circular</span>
          </label>
        </div>
      </div>

      {/* Overlay Position */}
      <div class="space-y-2">
        <label class="block text-sm font-medium text-text-muted">
          Overlay Position
        </label>
        <select
          value={settings().overlay_position}
          onChange={(e) => updateSetting("overlay_position", e.target.value as any)}
          class="w-full px-4 py-2 bg-background rounded-lg border border-white/10"
        >
          <option value="top_left">Top Left</option>
          <option value="top_center">Top Center</option>
          <option value="top_right">Top Right</option>
          <option value="bottom_left">Bottom Left</option>
          <option value="bottom_center">Bottom Center</option>
          <option value="bottom_right">Bottom Right</option>
        </select>
        <p class="text-xs text-text-muted">
          Position of the recording overlay on your screen
        </p>
      </div>

      {/* History */}
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings().history_enabled}
            onChange={(e) =>
              updateSetting("history_enabled", e.target.checked)
            }
            class="w-4 h-4 accent-primary rounded"
          />
          <span>Enable transcription history</span>
        </label>
      </div>

      {/* Auto-start */}
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings().auto_start}
            onChange={(e) => updateSetting("auto_start", e.target.checked)}
            class="w-4 h-4 accent-primary rounded"
          />
          <span>Start Murmur on system startup</span>
        </label>
      </div>
    </div>
  );
};
