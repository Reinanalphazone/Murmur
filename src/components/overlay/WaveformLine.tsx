import { Component, createEffect } from "solid-js";

interface WaveformLineProps {
  levels: number[];
  color?: string;
}

export const WaveformLine: Component<WaveformLineProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  const lineColor = () => props.color || "#6366f1";

  createEffect(() => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    const width = canvasRef.width;
    const height = canvasRef.height;
    const levels = props.levels;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw wave
    ctx.beginPath();
    ctx.strokeStyle = lineColor();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const segmentWidth = width / (levels.length - 1);
    const centerY = height / 2;

    ctx.moveTo(0, centerY);

    for (let i = 0; i < levels.length; i++) {
      const x = i * segmentWidth;
      const amplitude = levels[i] * (height / 2) * 0.8;
      const y = centerY + (i % 2 === 0 ? -amplitude : amplitude);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        // Use quadratic curve for smooth lines
        const prevX = (i - 1) * segmentWidth;
        const cpX = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, centerY + (((i - 1) % 2 === 0 ? -1 : 1) * levels[i - 1] * (height / 2) * 0.8), cpX, (centerY + (((i - 1) % 2 === 0 ? -1 : 1) * levels[i - 1] * (height / 2) * 0.8) + y) / 2);
      }
    }

    ctx.stroke();

    // Add glow effect
    ctx.shadowColor = lineColor();
    ctx.shadowBlur = 10;
    ctx.stroke();
  });

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={64}
      class="w-64 h-16"
    />
  );
};
