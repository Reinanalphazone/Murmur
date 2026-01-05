import { Component } from "solid-js";

export const AboutPanel: Component = () => {
  return (
    <div class="space-y-6">
      <div class="text-center space-y-2">
        <h2 class="text-2xl font-bold text-primary">Murmur</h2>
        <p class="text-text-muted">Voice-to-text with AI cleanup</p>
        <p class="text-sm text-text-muted">Version 0.1.0</p>
      </div>

      <div class="bg-background/50 rounded-lg p-4 space-y-4">
        <h4 class="font-medium">About</h4>
        <p class="text-sm text-text-muted">
          Murmur is a cross-platform desktop application that converts your voice
          to text with optional AI-powered cleanup. It works completely offline
          using local AI models, ensuring your privacy.
        </p>
      </div>

      <div class="bg-background/50 rounded-lg p-4 space-y-3">
        <h4 class="font-medium">Features</h4>
        <ul class="text-sm text-text-muted space-y-2">
          <li class="flex items-start gap-2">
            <span class="text-primary mt-0.5">•</span>
            <span>Fast, accurate speech-to-text using Whisper</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary mt-0.5">•</span>
            <span>AI-powered text cleanup with Phi-3</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary mt-0.5">•</span>
            <span>Global hotkey activation</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary mt-0.5">•</span>
            <span>System tray operation</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="text-primary mt-0.5">•</span>
            <span>100% offline - your data stays on your device</span>
          </li>
        </ul>
      </div>

      <div class="bg-background/50 rounded-lg p-4 space-y-3">
        <h4 class="font-medium">Technologies</h4>
        <div class="grid grid-cols-2 gap-2 text-sm text-text-muted">
          <div>Tauri v2</div>
          <div>SolidJS</div>
          <div>Whisper.cpp</div>
          <div>llama.cpp</div>
          <div>Rust</div>
          <div>TypeScript</div>
        </div>
      </div>

      <div class="bg-background/50 rounded-lg p-4 space-y-3">
        <h4 class="font-medium">Keyboard Shortcuts</h4>
        <div class="text-sm text-text-muted space-y-1">
          <div class="flex justify-between">
            <span>Toggle Recording</span>
            <kbd class="px-2 py-0.5 bg-background rounded font-mono text-xs">
              Ctrl+Shift+Space
            </kbd>
          </div>
        </div>
      </div>

      <div class="text-center text-sm text-text-muted">
        <p>Free and Open Source</p>
        <p class="mt-1">Made with care for privacy-conscious users</p>
      </div>
    </div>
  );
};
