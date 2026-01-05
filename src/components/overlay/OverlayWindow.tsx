import { Component } from "solid-js";

export const OverlayWindow: Component = () => {
  return (
    <div class="w-full h-full flex items-center justify-center">
      <div
        class="flex items-center justify-center px-6 py-3 rounded-full"
        style={{
          background: "rgba(20, 30, 50, 0.95)",
          border: "2px solid #3b82f6",
          "box-shadow": "0 4px 20px rgba(0,0,0,0.6), 0 0 15px rgba(59, 130, 246, 0.4)",
        }}
      >
        <span
          class="text-sm font-bold uppercase tracking-wide animate-pulse"
          style={{
            color: "#3b82f6",
            "text-shadow": "0 0 8px #3b82f6",
          }}
        >
          Listening...
        </span>
      </div>
    </div>
  );
};
