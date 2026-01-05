import { Component, createSignal, onMount, Show } from "solid-js";
import { listen } from "@tauri-apps/api/event";
import { useSettings } from "./stores/settingsStore";
import { useRecording } from "./stores/recordingStore";
import { SettingsPanel } from "./components/settings";
import { HistoryPanel } from "./components/history/HistoryPanel";
import { SetupWizard } from "./components/wizard/SetupWizard";
import { loadWhisper, loadLlm, isWhisperLoaded, isLlmLoaded } from "./lib/tauri";

type View = "home" | "settings" | "history";

const App: Component = () => {
  const { settings, loadSettings, isLoading } = useSettings();
  const { recordingState, toggleRecording, transcribedText, error } = useRecording();
  const [currentView, setCurrentView] = createSignal<View>("home");
  const [showWizard, setShowWizard] = createSignal(false);

  onMount(async () => {
    await loadSettings();

    // Check if first run
    if (!settings().first_run_complete) {
      setShowWizard(true);
    }

    // Load models if not already loaded
    console.log("[App] Checking model status...");
    try {
      const whisperLoaded = await isWhisperLoaded();
      console.log("[App] Whisper loaded status:", whisperLoaded);

      if (!whisperLoaded) {
        console.log("[App] Loading Whisper model... This may take a few seconds.");
        try {
          await loadWhisper();
          console.log("[App] ✓ Whisper model loaded successfully");
        } catch (whisperError) {
          console.error("[App] ✗ Failed to load Whisper model:", whisperError);
          alert(`Failed to load Whisper model: ${whisperError}\n\nPlease check the Settings page to ensure the model is installed.`);
        }
      } else {
        console.log("[App] ✓ Whisper model already loaded");
      }

      const llmLoaded = await isLlmLoaded();
      console.log("[App] LLM loaded status:", llmLoaded);

      if (!llmLoaded && settings().cleanup_enabled) {
        console.log("[App] Loading LLM model... This may take a few seconds.");
        try {
          await loadLlm();
          console.log("[App] ✓ LLM model loaded successfully");
        } catch (llmError) {
          console.error("[App] ✗ Failed to load LLM model:", llmError);
        }
      } else if (llmLoaded) {
        console.log("[App] ✓ LLM model already loaded");
      }
    } catch (e) {
      console.error("[App] ✗ Failed to check/load models:", e);
      alert(`Failed to initialize models: ${e}`);
    }

    console.log("[App] Setting up toggle-recording event listener");
    await listen("toggle-recording", async () => {
      console.log("[App] Toggle-recording event received!");
      await toggleRecording(settings().selected_device || undefined);
    });
    console.log("[App] Event listener registered successfully");
  });

  const handleWizardComplete = () => {
    setShowWizard(false);
  };


  return (
    <div class="min-h-screen bg-background text-text">
      <div class="container mx-auto p-6">
        {/* Header with Navigation */}
        <header class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-primary">Murmur</h1>
            <p class="text-text-muted text-sm">Voice-to-text with AI cleanup</p>
          </div>
          <nav class="flex gap-2">
            <button
              onClick={() => setCurrentView("home")}
              class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView() === "home"
                  ? "bg-primary text-white"
                  : "bg-surface hover:bg-surface/80 text-text"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView("history")}
              class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView() === "history"
                  ? "bg-primary text-white"
                  : "bg-surface hover:bg-surface/80 text-text"
              }`}
            >
              History
            </button>
            <button
              onClick={() => setCurrentView("settings")}
              class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView() === "settings"
                  ? "bg-primary text-white"
                  : "bg-surface hover:bg-surface/80 text-text"
              }`}
            >
              Settings
            </button>
          </nav>
        </header>

        <Show when={isLoading()}>
          <div class="flex items-center justify-center py-12">
            <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </Show>

        <Show when={!isLoading()}>
          {/* Home View */}
          <Show when={currentView() === "home"}>
            <div class="space-y-6">
              {/* Recording Status Card */}
              <div class="bg-surface rounded-xl p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-lg font-semibold">Status</h2>
                    <p class="text-text-muted text-sm">
                      {recordingState() === "idle"
                        ? "Ready to record"
                        : recordingState() === "listening"
                        ? "Listening..."
                        : recordingState() === "recording"
                        ? "Hearing speech..."
                        : recordingState() === "transcribing"
                        ? "Transcribing..."
                        : recordingState() === "cleanup"
                        ? "Cleaning up..."
                        : recordingState() === "done"
                        ? "Done!"
                        : recordingState()}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleRecording(settings().selected_device || undefined)}
                    class={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      recordingState() === "listening" || recordingState() === "recording"
                        ? "bg-error hover:bg-error/80"
                        : "bg-primary hover:bg-primary-dark"
                    }`}
                    disabled={recordingState() === "transcribing" || recordingState() === "cleanup"}
                  >
                    {recordingState() === "listening" || recordingState() === "recording" ? "Stop" : "Start Recording"}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              <Show when={error()}>
                <div class="bg-error/10 border border-error rounded-lg p-4">
                  <p class="text-error">{error()}</p>
                </div>
              </Show>

              {/* Last Transcription */}
              <Show when={transcribedText()}>
                <div class="bg-surface rounded-xl p-6">
                  <h2 class="text-lg font-semibold mb-3">Last Transcription</h2>
                  <div class="bg-background rounded-lg p-4">
                    <p class="whitespace-pre-wrap">{transcribedText()}</p>
                  </div>
                  <div class="mt-3 flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(transcribedText()!)}
                      class="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              </Show>

              {/* Quick Settings Display */}
              <div class="bg-surface rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-lg font-semibold">Quick Settings</h2>
                  <button
                    onClick={() => setCurrentView("settings")}
                    class="text-sm text-primary hover:text-primary-dark"
                  >
                    View All Settings
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-text-muted">Hotkey:</span>
                    <span class="ml-2 font-mono bg-background px-2 py-0.5 rounded">
                      {settings().hotkey}
                    </span>
                  </div>
                  <div>
                    <span class="text-text-muted">Mode:</span>
                    <span class="ml-2 capitalize">{settings().activation_mode}</span>
                  </div>
                  <div>
                    <span class="text-text-muted">AI Cleanup:</span>
                    <span class="ml-2">
                      {settings().cleanup_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <span class="text-text-muted">Waveform:</span>
                    <span class="ml-2 capitalize">{settings().waveform_style}</span>
                  </div>
                </div>
              </div>
            </div>
          </Show>

          {/* Settings View */}
          <Show when={currentView() === "settings"}>
            <SettingsPanel />
          </Show>

          {/* History View */}
          <Show when={currentView() === "history"}>
            <HistoryPanel />
          </Show>
        </Show>
      </div>


      {/* First Run Setup Wizard */}
      <Show when={showWizard()}>
        <SetupWizard onComplete={handleWizardComplete} />
      </Show>
    </div>
  );
};

export default App;
