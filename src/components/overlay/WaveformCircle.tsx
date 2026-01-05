import { Component, createEffect } from "solid-js";

interface WaveformCircleProps {
  levels: number[];
  color?: string;
}

export const WaveformCircle: Component<WaveformCircleProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  const color = () => props.color || "#6366f1";

  createEffect(() => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    const width = canvasRef.width;
    const height = canvasRef.height;
    const levels = props.levels;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) / 4;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw circular waveform
    ctx.beginPath();
    ctx.strokeStyle = color();
    ctx.lineWidth = 2;

    const numPoints = levels.length;
    const angleStep = (Math.PI * 2) / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const level = levels[i % numPoints];
      const radius = baseRadius + level * baseRadius * 0.8;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.stroke();

    // Add glow effect
    ctx.shadowColor = color();
    ctx.shadowBlur = 15;
    ctx.stroke();

    // Draw inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = color();
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={128}
      class="w-32 h-32"
    />
  );
};
