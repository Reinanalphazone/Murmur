import { Component, createSignal, For, Show } from "solid-js";
import { GeneralSettings } from "./GeneralSettings";
import { AudioSettings } from "./AudioSettings";
import { AISettings } from "./AISettings";
import { AboutPanel } from "./AboutPanel";

type Tab = "general" | "audio" | "ai" | "about";

const tabs: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "audio", label: "Audio" },
  { id: "ai", label: "AI" },
  { id: "about", label: "About" },
];

export const SettingsPanel: Component = () => {
  const [activeTab, setActiveTab] = createSignal<Tab>("general");

  return (
    <div class="bg-surface rounded-xl overflow-hidden">
      {/* Tab navigation */}
      <div class="flex border-b border-white/10">
        <For each={tabs}>
          {(tab) => (
            <button
              onClick={() => setActiveTab(tab.id)}
              class={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab() === tab.id
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-text-muted hover:text-text hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          )}
        </For>
      </div>

      {/* Tab content */}
      <div class="p-6">
        <Show when={activeTab() === "general"}>
          <GeneralSettings />
        </Show>
        <Show when={activeTab() === "audio"}>
          <AudioSettings />
        </Show>
        <Show when={activeTab() === "ai"}>
          <AISettings />
        </Show>
        <Show when={activeTab() === "about"}>
          <AboutPanel />
        </Show>
      </div>
    </div>
  );
};
