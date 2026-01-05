import { Component, createSignal, onMount, For, Show } from "solid-js";
import { getHistory, deleteHistoryEntry, clearHistory, HistoryEntry } from "../../lib/tauri";

export const HistoryPanel: Component = () => {
  const [entries, setEntries] = createSignal<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    await loadHistory();
  });

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const history = await getHistory(100);
      setEntries(history);
    } catch (err) {
      setError("Failed to load history");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteHistoryEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError("Failed to delete entry");
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all history? This cannot be undone.")) {
      return;
    }
    try {
      await clearHistory();
      setEntries([]);
    } catch (err) {
      setError("Failed to clear history");
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Transcription History</h2>
        <Show when={entries().length > 0}>
          <button
            onClick={handleClearAll}
            class="px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-lg text-sm font-medium"
          >
            Clear All
          </button>
        </Show>
      </div>

      <Show when={error()}>
        <div class="bg-error/10 border border-error rounded-lg p-4">
          <p class="text-error">{error()}</p>
        </div>
      </Show>

      <Show when={isLoading()}>
        <div class="flex items-center justify-center py-12">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Show>

      <Show when={!isLoading() && entries().length === 0}>
        <div class="bg-surface rounded-xl p-8 text-center">
          <div class="text-4xl mb-4 opacity-50">📝</div>
          <h3 class="text-lg font-medium mb-2">No history yet</h3>
          <p class="text-text-muted">
            Your transcriptions will appear here after you record something.
          </p>
        </div>
      </Show>

      <Show when={!isLoading() && entries().length > 0}>
        <div class="space-y-4">
          <For each={entries()}>
            {(entry) => (
              <div class="bg-surface rounded-xl p-4 space-y-3">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-text-muted mb-2">
                      {formatDate(entry.created_at)}
                    </p>
                    <div class="space-y-2">
                      <div>
                        <p class="text-xs text-text-muted uppercase tracking-wide mb-1">
                          Original
                        </p>
                        <p class="text-sm bg-background rounded-lg p-3 whitespace-pre-wrap">
                          {entry.original_text}
                        </p>
                      </div>
                      <Show when={entry.cleaned_text}>
                        <div>
                          <p class="text-xs text-text-muted uppercase tracking-wide mb-1">
                            Cleaned
                          </p>
                          <p class="text-sm bg-primary/5 border border-primary/20 rounded-lg p-3 whitespace-pre-wrap">
                            {entry.cleaned_text}
                          </p>
                        </div>
                      </Show>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(entry.cleaned_text || entry.original_text)
                      }
                      class="p-2 hover:bg-background rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg
                        class="w-4 h-4 text-text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      class="p-2 hover:bg-error/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg
                        class="w-4 h-4 text-error"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};
