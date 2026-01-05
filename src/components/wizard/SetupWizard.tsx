import { Component, createSignal, Show, For, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useSettings } from "../../stores/settingsStore";
import { getAudioDevices, AudioDevice } from "../../lib/tauri";

interface DownloadProgress {
  model_name: string;
  downloaded: number;
  total: number;
  percentage: number;
}

type WizardStep = "welcome" | "audio" | "models" | "hotkey" | "complete";

interface Props {
  onComplete: () => void;
}

export const SetupWizard: Component<Props> = (props) => {
  const { updateSetting } = useSettings();
  const [currentStep, setCurrentStep] = createSignal<WizardStep>("welcome");
  const [devices, setDevices] = createSignal<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = createSignal("");
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [downloadProgress, setDownloadProgress] = createSignal<DownloadProgress | null>(null);
  const [whisperDownloaded, setWhisperDownloaded] = createSignal(false);
  const [hotkeyInput, setHotkeyInput] = createSignal("Control+Shift+Space");
  const [isRecordingHotkey, setIsRecordingHotkey] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const steps: WizardStep[] = ["welcome", "audio", "models", "hotkey", "complete"];

  onMount(async () => {
    // Load audio devices
    try {
      const audioDevices = await getAudioDevices();
      setDevices(audioDevices);
      const defaultDevice = audioDevices.find((d) => d.is_default);
      if (defaultDevice) {
        setSelectedDevice(defaultDevice.name);
      }
    } catch (err) {
      console.error("Failed to load audio devices:", err);
    }

    // Check model status
    try {
      const status = await invoke<{ whisper_downloaded: boolean }>("get_models_status");
      setWhisperDownloaded(status.whisper_downloaded);
    } catch (err) {
      console.error("Failed to check model status:", err);
    }

    // Listen for download progress
    await listen<DownloadProgress>("download-progress", (event) => {
      setDownloadProgress(event.payload);
    });
  });

  const nextStep = () => {
    const currentIndex = steps.indexOf(currentStep());
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(currentStep());
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const downloadWhisper = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      await invoke("download_whisper_model");
      setWhisperDownloaded(true);
    } catch (err) {
      setError(`Failed to download: ${err}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

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

      if (!["Control", "Shift", "Alt", "Meta"].includes(key)) {
        setIsRecordingHotkey(false);
      }
    }
  };

  const finishSetup = async () => {
    // Save all settings
    await updateSetting("selected_device", selectedDevice());
    await updateSetting("hotkey", hotkeyInput());
    await updateSetting("first_run_complete", true);
    props.onComplete();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const stepProgress = () => {
    const currentIndex = steps.indexOf(currentStep());
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <div class="fixed inset-0 bg-background flex items-center justify-center p-6 z-50">
      <div class="bg-surface rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Progress bar */}
        <div class="h-1 bg-white/10">
          <div
            class="h-full bg-primary transition-all duration-300"
            style={{ width: `${stepProgress()}%` }}
          />
        </div>

        <div class="p-8">
          {/* Welcome Step */}
          <Show when={currentStep() === "welcome"}>
            <div class="text-center space-y-6">
              <div class="text-5xl">👋</div>
              <h1 class="text-2xl font-bold">Welcome to Murmur</h1>
              <p class="text-text-muted">
                Let's set up your voice-to-text experience. This will only take
                a minute.
              </p>
              <div class="pt-4">
                <button
                  onClick={nextStep}
                  class="w-full px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          </Show>

          {/* Audio Step */}
          <Show when={currentStep() === "audio"}>
            <div class="space-y-6">
              <div class="text-center">
                <div class="text-4xl mb-4">🎤</div>
                <h2 class="text-xl font-bold">Select Your Microphone</h2>
                <p class="text-text-muted text-sm mt-2">
                  Choose the microphone you'll use for voice input
                </p>
              </div>

              <div class="space-y-2">
                <For each={devices()}>
                  {(device) => (
                    <label
                      class={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedDevice() === device.name
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-background hover:bg-background/80 border-2 border-transparent"
                      }`}
                    >
                      <input
                        type="radio"
                        name="device"
                        checked={selectedDevice() === device.name}
                        onChange={() => setSelectedDevice(device.name)}
                        class="w-4 h-4 accent-primary"
                      />
                      <div>
                        <p class="font-medium">{device.name}</p>
                        {device.is_default && (
                          <span class="text-xs text-primary">System Default</span>
                        )}
                      </div>
                    </label>
                  )}
                </For>
              </div>

              <div class="flex gap-3">
                <button
                  onClick={prevStep}
                  class="flex-1 px-6 py-3 bg-background hover:bg-background/80 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  class="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </Show>

          {/* Models Step */}
          <Show when={currentStep() === "models"}>
            <div class="space-y-6">
              <div class="text-center">
                <div class="text-4xl mb-4">🧠</div>
                <h2 class="text-xl font-bold">Download AI Model</h2>
                <p class="text-text-muted text-sm mt-2">
                  Download the Whisper model for local speech recognition
                </p>
              </div>

              <Show when={error()}>
                <div class="bg-error/10 border border-error rounded-lg p-3">
                  <p class="text-sm text-error">{error()}</p>
                </div>
              </Show>

              <Show when={isDownloading() && downloadProgress()}>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span>{downloadProgress()!.model_name}</span>
                    <span>{downloadProgress()!.percentage.toFixed(1)}%</span>
                  </div>
                  <div class="w-full bg-background rounded-full h-3">
                    <div
                      class="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${downloadProgress()!.percentage}%` }}
                    />
                  </div>
                  <p class="text-xs text-text-muted text-center">
                    {formatBytes(downloadProgress()!.downloaded)} /{" "}
                    {formatBytes(downloadProgress()!.total)}
                  </p>
                </div>
              </Show>

              <Show when={!isDownloading()}>
                <div class="bg-background rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium">Whisper Base (English)</p>
                      <p class="text-sm text-text-muted">~150 MB</p>
                    </div>
                    <Show
                      when={whisperDownloaded()}
                      fallback={
                        <button
                          onClick={downloadWhisper}
                          class="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors"
                        >
                          Download
                        </button>
                      }
                    >
                      <span class="text-success flex items-center gap-1">
                        <svg
                          class="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        Ready
                      </span>
                    </Show>
                  </div>
                </div>
              </Show>

              <p class="text-xs text-text-muted text-center">
                You can download additional models later in Settings
              </p>

              <div class="flex gap-3">
                <button
                  onClick={prevStep}
                  class="flex-1 px-6 py-3 bg-background hover:bg-background/80 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={isDownloading()}
                  class="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {whisperDownloaded() ? "Continue" : "Skip for Now"}
                </button>
              </div>
            </div>
          </Show>

          {/* Hotkey Step */}
          <Show when={currentStep() === "hotkey"}>
            <div class="space-y-6">
              <div class="text-center">
                <div class="text-4xl mb-4">⌨️</div>
                <h2 class="text-xl font-bold">Set Your Hotkey</h2>
                <p class="text-text-muted text-sm mt-2">
                  Choose a keyboard shortcut to start recording
                </p>
              </div>

              <div class="space-y-2">
                <input
                  type="text"
                  value={hotkeyInput()}
                  onFocus={() => setIsRecordingHotkey(true)}
                  onBlur={() => setIsRecordingHotkey(false)}
                  onKeyDown={handleHotkeyKeyDown}
                  readonly
                  class={`w-full px-4 py-3 bg-background rounded-lg border text-center font-mono text-lg transition-colors ${
                    isRecordingHotkey()
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-white/10"
                  }`}
                />
                <p class="text-xs text-text-muted text-center">
                  {isRecordingHotkey()
                    ? "Press your desired key combination..."
                    : "Click to change"}
                </p>
              </div>

              <div class="flex gap-3">
                <button
                  onClick={prevStep}
                  class="flex-1 px-6 py-3 bg-background hover:bg-background/80 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  class="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </Show>

          {/* Complete Step */}
          <Show when={currentStep() === "complete"}>
            <div class="text-center space-y-6">
              <div class="text-5xl">🎉</div>
              <h1 class="text-2xl font-bold">You're All Set!</h1>
              <p class="text-text-muted">
                Press <kbd class="px-2 py-1 bg-background rounded font-mono text-sm">{hotkeyInput()}</kbd> to
                start recording anytime.
              </p>

              <div class="bg-background rounded-lg p-4 text-left space-y-2 text-sm">
                <p>
                  <span class="text-text-muted">Microphone:</span>{" "}
                  <span class="font-medium">{selectedDevice() || "Default"}</span>
                </p>
                <p>
                  <span class="text-text-muted">Whisper Model:</span>{" "}
                  <span class="font-medium">
                    {whisperDownloaded() ? "Downloaded" : "Not downloaded"}
                  </span>
                </p>
                <p>
                  <span class="text-text-muted">Hotkey:</span>{" "}
                  <span class="font-medium font-mono">{hotkeyInput()}</span>
                </p>
              </div>

              <div class="pt-4">
                <button
                  onClick={finishSetup}
                  class="w-full px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors"
                >
                  Start Using Murmur
                </button>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
};
