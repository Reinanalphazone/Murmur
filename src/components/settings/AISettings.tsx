import { Component, createSignal, onMount, Show } from "solid-js";
import { useSettings } from "../../stores/settingsStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface ModelsStatus {
  whisper_downloaded: boolean;
  llm_downloaded: boolean;
}

interface DownloadProgress {
  model_name: string;
  downloaded: number;
  total: number;
  percentage: number;
}

export const AISettings: Component = () => {
  const { settings, updateSetting } = useSettings();
  const [modelsStatus, setModelsStatus] = createSignal<ModelsStatus | null>(null);
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [downloadProgress, setDownloadProgress] = createSignal<DownloadProgress | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    await checkModelsStatus();

    // Listen for download progress events
    await listen<DownloadProgress>("download-progress", (event) => {
      setDownloadProgress(event.payload);
    });
  });

  const checkModelsStatus = async () => {
    try {
      const status = await invoke<ModelsStatus>("get_models_status");
      setModelsStatus(status);
    } catch (err) {
      console.error("Failed to check models status:", err);
    }
  };

  const downloadWhisper = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      await invoke("download_whisper_model");
      await checkModelsStatus();
    } catch (err) {
      setError(`Failed to download Whisper model: ${err}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const downloadLLM = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      await invoke("download_llm_model");
      await checkModelsStatus();
    } catch (err) {
      setError(`Failed to download LLM model: ${err}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div class="space-y-6">
      <h3 class="text-lg font-semibold">AI Settings</h3>

      {/* AI Cleanup Toggle */}
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings().cleanup_enabled}
            onChange={(e) => updateSetting("cleanup_enabled", e.target.checked)}
            class="w-4 h-4 accent-primary rounded"
          />
          <span>Enable AI text cleanup</span>
        </label>
        <p class="text-sm text-text-muted ml-6">
          Automatically clean up filler words, fix grammar, and improve formatting
        </p>
      </div>

      {/* Auto-paste Toggle */}
      <Show when={settings().cleanup_enabled}>
        <div class="space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings().auto_paste}
              onChange={(e) => updateSetting("auto_paste", e.target.checked)}
              class="w-4 h-4 accent-primary rounded"
            />
            <span>Auto-paste transcribed text</span>
          </label>
          <p class="text-sm text-text-muted ml-6">
            Automatically paste the cleaned text into the active window after transcription
          </p>
        </div>
      </Show>

      {/* Cleanup Mode */}
      <Show when={settings().cleanup_enabled}>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-text-muted">
            Cleanup Mode
          </label>
          <select
            value={settings().cleanup_mode}
            onChange={(e) => updateSetting("cleanup_mode", e.target.value)}
            class="w-full px-4 py-2 bg-background rounded-lg border border-white/10"
          >
            <option value="basic">Basic - Remove filler words, fix grammar</option>
            <option value="formal">Formal - Professional writing style</option>
            <option value="casual">Casual - Friendly, conversational style</option>
            <option value="custom">Custom - Use your own prompt</option>
          </select>
        </div>
      </Show>

      {/* Custom Cleanup Prompt */}
      <Show when={settings().cleanup_enabled && settings().cleanup_mode === "custom"}>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-text-muted">
            Custom Cleanup Prompt
          </label>
          <textarea
            value={settings().cleanup_prompt}
            onChange={(e) => updateSetting("cleanup_prompt", e.target.value)}
            class="w-full px-4 py-2 bg-background rounded-lg border border-white/10 min-h-[100px] resize-y"
            placeholder="Enter your custom instructions for the AI..."
          />
          <p class="text-xs text-text-muted">
            This prompt tells the AI how to process your transcribed text. Include instructions like "Output ONLY the cleaned text" to avoid extra commentary.
          </p>
        </div>
      </Show>

      {/* STT Provider */}
      <div class="space-y-2">
        <label class="block text-sm font-medium text-text-muted">
          Speech-to-Text Provider
        </label>
        <select
          value={settings().stt_provider}
          onChange={(e) => updateSetting("stt_provider", e.target.value)}
          class="w-full px-4 py-2 bg-background rounded-lg border border-white/10"
        >
          <option value="local">Local (Whisper.cpp)</option>
          <option value="openai">OpenAI Whisper API</option>
          <option value="groq">Groq</option>
          <option value="deepgram">Deepgram</option>
        </select>
      </div>

      {/* LLM Provider */}
      <Show when={settings().cleanup_enabled}>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-text-muted">
            AI Cleanup Provider
          </label>
          <select
            value={settings().llm_provider}
            onChange={(e) => updateSetting("llm_provider", e.target.value)}
            class="w-full px-4 py-2 bg-background rounded-lg border border-white/10"
          >
            <option value="local">Local (Phi-3 Mini)</option>
            <option value="openai">OpenAI GPT</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="groq">Groq</option>
          </select>
        </div>
      </Show>

      {/* Local Models Section */}
      <Show when={settings().stt_provider === "local" || settings().llm_provider === "local"}>
        <div class="bg-background/50 rounded-lg p-4 space-y-4">
          <h4 class="text-sm font-medium">Local Models</h4>

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
              <div class="w-full bg-background rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${downloadProgress()!.percentage}%` }}
                />
              </div>
              <p class="text-xs text-text-muted">
                {formatBytes(downloadProgress()!.downloaded)} / {formatBytes(downloadProgress()!.total)}
              </p>
            </div>
          </Show>

          {/* Whisper Model */}
          <Show when={settings().stt_provider === "local"}>
            <div class="flex items-center justify-between p-3 bg-background rounded-lg">
              <div>
                <p class="font-medium">Whisper Base (English)</p>
                <p class="text-sm text-text-muted">~150 MB</p>
              </div>
              <Show
                when={modelsStatus()?.whisper_downloaded}
                fallback={
                  <button
                    onClick={downloadWhisper}
                    disabled={isDownloading()}
                    class="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {isDownloading() ? "Downloading..." : "Download"}
                  </button>
                }
              >
                <span class="text-success flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Installed
                </span>
              </Show>
            </div>
          </Show>

          {/* LLM Model */}
          <Show when={settings().llm_provider === "local" && settings().cleanup_enabled}>
            <div class="flex items-center justify-between p-3 bg-background rounded-lg">
              <div>
                <p class="font-medium">Phi-3 Mini 4K</p>
                <p class="text-sm text-text-muted">~2.4 GB</p>
              </div>
              <Show
                when={modelsStatus()?.llm_downloaded}
                fallback={
                  <button
                    onClick={downloadLLM}
                    disabled={isDownloading()}
                    class="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {isDownloading() ? "Downloading..." : "Download"}
                  </button>
                }
              >
                <span class="text-success flex items-center gap-1">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Installed
                </span>
              </Show>
            </div>
          </Show>
        </div>
      </Show>

      {/* Privacy Note */}
      <div class="bg-success/5 border border-success/20 rounded-lg p-4">
        <h4 class="text-sm font-medium text-success">Privacy</h4>
        <p class="text-sm text-text-muted mt-1">
          When using local models, all processing happens on your device. Your
          audio and text never leave your computer.
        </p>
      </div>
    </div>
  );
};
