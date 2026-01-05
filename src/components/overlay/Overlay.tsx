import { Component, createEffect, createMemo } from "solid-js";
import { useRecording, RecordingState } from "../../stores/recordingStore";
import { useSettings } from "../../stores/settingsStore";
import { OverlayPosition } from "../../lib/tauri";

const stateColors: Record<RecordingState, string> = {
  idle: "#6b7280",
  listening: "#3b82f6",
  recording: "#ef4444",
  transcribing: "#f59e0b",
  cleanup: "#8b5cf6",
  done: "#22c55e",
};

const stateLabels: Record<RecordingState, string> = {
  idle: "",
  listening: "Listening",
  recording: "Hearing",
  transcribing: "Transcribing",
  cleanup: "Cleaning",
  done: "Done",
};

const positionClasses: Record<OverlayPosition, string> = {
  top_left: "items-start justify-start pt-8 pl-8",
  top_center: "items-start justify-center pt-8",
  top_right: "items-start justify-end pt-8 pr-8",
  bottom_left: "items-end justify-start pb-8 pl-8",
  bottom_center: "items-end justify-center pb-8",
  bottom_right: "items-end justify-end pb-8 pr-8",
};

export const Overlay: Component = () => {
  const { recordingState, audioLevels } = useRecording();
  const { settings } = useSettings();
  let canvasRef: HTMLCanvasElement | undefined;

  const stage = createMemo(() => ({
    color: stateColors[recordingState()],
    label: stateLabels[recordingState()],
  }));

  const positionClass = () =>
    positionClasses[settings().overlay_position] || positionClasses.bottom_center;

  // Draw waveform/animations
  createEffect(() => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    const levels = audioLevels();
    const width = canvasRef.width;
    const height = canvasRef.height;
    const color = stage().color;
    const state = recordingState();

    ctx.clearRect(0, 0, width, height);

    if (state === "listening" || state === "recording") {
      drawWaveform(ctx, levels, width, height, color, state === "recording");
    } else if (state === "transcribing" || state === "cleanup") {
      drawProcessingPulse(ctx, width, height, color);
    } else if (state === "done") {
      drawCheckmark(ctx, width, height, color);
    }
  });

  return (
    <div class={`fixed inset-0 flex pointer-events-none ${positionClass()}`}>
      <div class="flex items-center gap-3 pointer-events-auto">
        {/* Waveform canvas */}
        <canvas
          ref={canvasRef}
          width={120}
          height={40}
          class="w-[120px] h-[40px]"
        />

        {/* Stage label */}
        <div
          class="text-xs font-medium tracking-wide uppercase opacity-90 transition-all duration-300"
          style={{ color: stage().color }}
        >
          {stage().label}
        </div>
      </div>
    </div>
  );
};

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  levels: number[],
  width: number,
  height: number,
  color: string,
  isActive: boolean
) {
  const centerY = height / 2;
  const barCount = Math.min(levels.length, 24);
  const barWidth = 3;
  const gap = 2;
  const totalWidth = barCount * (barWidth + gap) - gap;
  const startX = (width - totalWidth) / 2;

  for (let i = 0; i < barCount; i++) {
    const level = levels[i] || 0;
    const amplitude = isActive ? level : level * 0.3;
    const barHeight = Math.max(2, amplitude * (height * 0.8));
    const x = startX + i * (barWidth + gap);
    const y = centerY - barHeight / 2;

    ctx.fillStyle = color;
    ctx.globalAlpha = isActive ? 0.9 : 0.4;

    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 1.5);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawProcessingPulse(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const time = Date.now() / 1000;

  for (let i = 0; i < 3; i++) {
    const offset = (time * 2 + i * 0.3) % 1;
    const scale = 0.5 + Math.sin(offset * Math.PI) * 0.5;
    const alpha = Math.sin(offset * Math.PI);

    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * 0.8;
    ctx.beginPath();
    ctx.arc(centerX - 20 + i * 20, centerY, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  requestAnimationFrame(() => {
    if (ctx.canvas.parentElement) {
      ctx.clearRect(0, 0, width, height);
      drawProcessingPulse(ctx, width, height, color);
    }
  });
}

function drawCheckmark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const size = 12;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.9;

  ctx.beginPath();
  ctx.moveTo(centerX - size, centerY);
  ctx.lineTo(centerX - size / 3, centerY + size * 0.6);
  ctx.lineTo(centerX + size, centerY - size * 0.5);
  ctx.stroke();

  ctx.globalAlpha = 1;
}
