import { Component, For } from "solid-js";

interface WaveformBarsProps {
  levels: number[];
  color?: string;
}

export const WaveformBars: Component<WaveformBarsProps> = (props) => {
  const barColor = () => props.color || "#6366f1";

  return (
    <div class="flex items-end justify-center gap-1 h-16">
      <For each={props.levels}>
        {(level) => (
          <div
            class="w-1 rounded-full transition-all duration-75"
            style={{
              height: `${Math.max(4, level * 64)}px`,
              "background-color": barColor(),
              opacity: 0.7 + level * 0.3,
            }}
          />
        )}
      </For>
    </div>
  );
};
