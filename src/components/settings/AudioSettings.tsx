import { Component, createSignal, onMount, For, Show } from "solid-js";
import { useSettings } from "../../stores/settingsStore";
import { getAudioDevices, AudioDevice } from "../../lib/tauri";

export const AudioSettings: Component = () => {
  const { settings, updateSetting } = useSettings();
  const [devices, setDevices] = createSignal<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const audioDevices = await getAudioDevices();
      setDevices(audioDevices);
    } catch (err) {
      setError("Failed to load audio devices");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  });

  const refreshDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const audioDevices = await getAudioDevices();
      setDevices(audioDevices);
    } catch (err) {
      setError("Failed to refresh audio devices");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="space-y-6">
      <h3 class="text-lg font-semibold">Audio Settings</h3>

      {/* Input Device Selection */}
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-text-muted">
            Input Device
          </label>
          <button
            onClick={refreshDevices}
            disabled={isLoading()}
            class="text-sm text-primary hover:text-primary-dark disabled:opacity-50"
          >
            {isLoading() ? "Loading..." : "Refresh"}
          </button>
        </div>

        <Show when={error()}>
          <p class="text-sm text-error">{error()}</p>
        </Show>

        <Show when={!isLoading()}>
          <select
            value={settings().selected_device}
            onChange={(e) => updateSetting("selected_device", e.target.value)}
            class="w-full px-4 py-2 bg-background rounded-lg border border-white/10"
          >
            <option value="">System Default</option>
            <For each={devices()}>
              {(device) => (
                <option value={device.name}>
                  {device.name} {device.is_default ? "(Default)" : ""}
                </option>
              )}
            </For>
          </select>
        </Show>

        <Show when={isLoading()}>
          <div class="w-full px-4 py-2 bg-background rounded-lg border border-white/10 text-text-muted">
            Loading devices...
          </div>
        </Show>
      </div>

      {/* Audio Quality Info */}
      <div class="bg-background/50 rounded-lg p-4 space-y-2">
        <h4 class="text-sm font-medium">Audio Quality</h4>
        <p class="text-sm text-text-muted">
          Audio is captured at the device's native sample rate and converted to
          16kHz mono for transcription. This provides optimal quality for speech
          recognition while minimizing file size.
        </p>
      </div>

      {/* Tips */}
      <div class="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
        <h4 class="text-sm font-medium text-primary">Tips for best results</h4>
        <ul class="text-sm text-text-muted space-y-1 list-disc list-inside">
          <li>Use a dedicated microphone for clearer audio</li>
          <li>Reduce background noise when possible</li>
          <li>Speak clearly at a consistent volume</li>
          <li>Position the microphone 6-12 inches from your mouth</li>
        </ul>
      </div>
    </div>
  );
};
