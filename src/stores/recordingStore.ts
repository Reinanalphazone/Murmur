import { createSignal } from "solid-js";
import {
  startRecording as startRecordingApi,
  stopRecording as stopRecordingApi,
  getAudioLevels,
  isRecording as isRecordingApi,
  transcribeAudio,
  cleanupText,
  pasteText,
  copyToClipboard,
  showOverlay,
  hideOverlay,
  emitOverlayState,
  emitOverlayLevels,
} from "../lib/tauri";
import { useSettings } from "./settingsStore";

export type RecordingState = "idle" | "listening" | "recording" | "transcribing" | "cleanup" | "done";

const [recordingState, setRecordingStateInternal] = createSignal<RecordingState>("idle");
const [audioLevels, setAudioLevelsInternal] = createSignal<number[]>(new Array(32).fill(0));
const [lastTranscription, setLastTranscription] = createSignal<string>("");
const [error, setError] = createSignal<string | null>(null);

let levelPollingInterval: ReturnType<typeof setInterval> | null = null;

// Wrapper to emit events when state changes (for overlay window via Rust)
function setRecordingState(state: RecordingState) {
  setRecordingStateInternal(state);
  // Emit to overlay window via Rust backend
  emitOverlayState(state).catch((e) => console.error("[Recording] Failed to emit state:", e));
}

function setAudioLevels(levels: number[]) {
  setAudioLevelsInternal(levels);
  // Emit to overlay window via Rust backend
  emitOverlayLevels(levels).catch((e) => console.error("[Recording] Failed to emit levels:", e));
}

async function startRecording(deviceName?: string) {
  try {
    console.log("[Recording] startRecording called with device:", deviceName);
    setError(null);
    await startRecordingApi(deviceName);
    console.log("[Recording] Recording API started successfully");
    setRecordingState("listening");

    // Show the overlay window
    const { settings } = useSettings();
    try {
      await showOverlay(settings().overlay_position);
      console.log("[Recording] Overlay shown");
    } catch (overlayError) {
      console.error("[Recording] Failed to show overlay:", overlayError);
    }

    // Start polling audio levels for visualization
    levelPollingInterval = setInterval(async () => {
      try {
        const levels = await getAudioLevels();
        setAudioLevels(levels);

        // Detect if user is speaking (any level above threshold)
        const maxLevel = Math.max(...levels);
        const currentState = recordingState();
        if (maxLevel > 0.1 && currentState === "listening") {
          setRecordingState("recording");
        } else if (maxLevel <= 0.05 && currentState === "recording") {
          // Could switch back to listening if silence, but keep recording for now
        }
      } catch (e) {
        console.error("Failed to get audio levels:", e);
      }
    }, 50); // ~20fps
  } catch (e) {
    setError(String(e));
    setRecordingState("idle");
    throw e;
  }
}

async function stopRecording(): Promise<Uint8Array> {
  try {
    // Stop polling
    if (levelPollingInterval) {
      clearInterval(levelPollingInterval);
      levelPollingInterval = null;
    }

    setRecordingState("transcribing");
    const audioData = await stopRecordingApi();

    // Transcribe the audio
    try {
      console.log("[Recording] Transcribing audio...");
      const transcription = await transcribeAudio(audioData);
      console.log("[Recording] Transcription:", transcription);

      // Apply cleanup if enabled
      const { settings } = useSettings();
      let finalText = transcription;

      if (settings().cleanup_enabled) {
        setRecordingState("cleanup");
        console.log("[Recording] Applying text cleanup...");
        const mode = settings().cleanup_mode;
        const customPrompt = mode === "custom" ? settings().cleanup_prompt : undefined;
        finalText = await cleanupText(transcription, mode, customPrompt);
        console.log("[Recording] Cleaned text:", finalText);
      }

      setLastTranscription(finalText);

      // Auto-paste or copy to clipboard based on settings
      if (settings().auto_paste) {
        console.log("[Recording] Auto-pasting text...");
        try {
          await pasteText(finalText, settings().paste_method);
          console.log("[Recording] Text pasted successfully");
        } catch (pasteError) {
          console.error("[Recording] Failed to paste:", pasteError);
          // Fallback to just copying to clipboard
          await copyToClipboard(finalText);
        }
      } else {
        // Just copy to clipboard if auto-paste is disabled
        await copyToClipboard(finalText);
        console.log("[Recording] Text copied to clipboard");
      }
    } catch (transcriptionError) {
      console.error("[Recording] Transcription failed:", transcriptionError);
      setError(`Transcription failed: ${transcriptionError}`);
    }

    setRecordingState("done");

    // Reset to idle after a brief moment and hide overlay
    setTimeout(async () => {
      setRecordingState("idle");
      try {
        await hideOverlay();
        console.log("[Recording] Overlay hidden");
      } catch (overlayError) {
        console.error("[Recording] Failed to hide overlay:", overlayError);
      }
    }, 1000);

    return audioData;
  } catch (e) {
    setError(String(e));
    setRecordingState("idle");
    throw e;
  }
}

async function toggleRecording(deviceName?: string): Promise<Uint8Array | null> {
  console.log("[Recording] toggleRecording called");
  const isCurrentlyRecording = await isRecordingApi();
  console.log("[Recording] Currently recording:", isCurrentlyRecording);

  if (isCurrentlyRecording) {
    console.log("[Recording] Stopping recording...");
    return stopRecording();
  } else {
    console.log("[Recording] Starting recording...");
    await startRecording(deviceName);
    return null;
  }
}

function setTranscription(text: string) {
  setLastTranscription(text);
}

function clearError() {
  setError(null);
}

export function useRecording() {
  return {
    recordingState,
    audioLevels,
    lastTranscription,
    transcribedText: lastTranscription,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
    setTranscription,
    clearError,
  };
}
