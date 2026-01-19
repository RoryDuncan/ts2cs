<script lang="ts">
  import "$lib/css/panes.css";
  import { PaneGroup, Pane, PaneResizer } from "paneforge";
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import CodeEditor from "$lib/components/CodeEditor.svelte";
  import CodeBlock from "$lib/components/CodeBlock.svelte";
  import { buildShareUrl } from "$lib/share";
  import { replaceState } from "$app/navigation";
  import type { RouteId, SubmitFunction } from "./$types";

  // Types
  type TranspileWarning = {
    message: string;
    line?: number;
    column?: number;
  };

  // Props from load function
  let { data } = $props();

  // Constants
  const MAX_INPUT_LENGTH = 50_000;
  const DEBOUNCE_MS = 750;

  // State - initialize from server data
  let tsInput = $state(data.tsInput);
  let csOutput = $state(data.csOutput);
  let error = $state<string | null>(data.error);
  let warnings = $state<TranspileWarning[]>(data.warnings);
  let isTranspiling = $state(false);
  let autoTranspile = $state(true);

  // Form reference for programmatic submission
  let formEl: HTMLFormElement;

  // Debounce timer for auto-transpile
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastInput = tsInput;

  // Auto-transpile effect - only track tsInput and autoTranspile
  $effect(() => {
    const input = tsInput;
    const auto = autoTranspile;

    // Only trigger if input actually changed
    if (input !== lastInput) {
      lastInput = input;

      if (auto && input.trim()) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          formEl?.requestSubmit();
        }, DEBOUNCE_MS);
      }
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  });

  // Helper to format warning location
  function formatWarningLocation(warning: TranspileWarning): string {
    if (warning.line && warning.column) {
      return `Line ${warning.line}, Column ${warning.column}`;
    } else if (warning.line) {
      return `Line ${warning.line}`;
    }
    return "";
  }

  const enhancedSubmit: SubmitFunction = () => {
    isTranspiling = true;
    error = null;

    if (tsInput === data.defaultCode) {
      replaceState("/repl", {});
    } else {
      const baseUrl: RouteId = "/repl/[[share_code]]";
      const shareUrl = buildShareUrl(tsInput, baseUrl);
      replaceState(shareUrl, {});
    }

    return async ({ result }) => {
      isTranspiling = false;

      if (result.type === "success" && result.data) {
        csOutput = result.data.output as string;
        warnings = (result.data.warnings as TranspileWarning[]) ?? [];
        error = null;
      } else if (result.type === "failure" && result.data) {
        error = (result.data.error as string) || "Transpilation failed";
        csOutput = "";
        warnings = (result.data.warnings as TranspileWarning[]) ?? [];
      } else if (result.type === "error") {
        error = result.error?.message || "An error occurred";
        csOutput = "";
        warnings = [];
      }
    };
  };
</script>

<svelte:head>
  <title>REPL - ts2cs</title>
</svelte:head>

<div class="repl-container">
  <PaneGroup direction="horizontal" class="pane-group">
    <Pane defaultSize={50} minSize={20} class="pane">
      <div class="panel">
        <form method="POST" action="?/transpile" bind:this={formEl} use:enhance={enhancedSubmit}>
          <div class="panel-header">
            <span class="panel-title">TypeScript</span>
            <div class="header-controls">
              <label class="auto-transpile-label">
                <input type="checkbox" bind:checked={autoTranspile} />
                <span>Auto</span>
              </label>
              <button type="submit" class="btn btn-primary transpile-btn" disabled={isTranspiling}>
                {isTranspiling ? "..." : "Transpile"}
              </button>
            </div>
          </div>
          <div class="panel-content">
            <input type="hidden" name="tsInput" value={tsInput} />
            <CodeEditor
              bind:value={tsInput}
              lang="typescript"
              maxlength={MAX_INPUT_LENGTH}
              placeholder="Enter TypeScript code..."
              disabled={isTranspiling}
            />
          </div>
        </form>
      </div>
    </Pane>

    <PaneResizer class="resizer">
      <div class="resizer-handle"></div>
    </PaneResizer>

    <Pane defaultSize={50} minSize={20} class="pane">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">C# Output</span>
          <div class="status-indicators">
            {#if warnings.length > 0}
              <span class="warning-indicator" title="{warnings.length} warning(s)">
                {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
              </span>
            {/if}
            {#if error}
              <span class="error-indicator">Error</span>
            {/if}
          </div>
        </div>

        <!-- Warnings display -->
        {#if warnings.length > 0}
          <div class="warnings-panel">
            {#each warnings as warning, i (i)}
              <div class="warning-item">
                <span class="material-symbols-outlined warning-icon">warning</span>
                <span class="warning-message">{warning.message}</span>
                {#if warning.line}
                  <span class="warning-location">{formatWarningLocation(warning)}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        <div class="panel-content">
          {#if error}
            <div class="error-display">
              <pre><code>// Error: {error}</code></pre>
            </div>
          {:else if csOutput}
            <CodeBlock code={csOutput} lang="csharp" loading={isTranspiling} />
          {:else}
            <div class="placeholder">
              <pre><code>// Click 'Transpile' to generate C# code</code></pre>
            </div>
          {/if}
        </div>
      </div>
    </Pane>
  </PaneGroup>
</div>

<style>
  .repl-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 60px);
    overflow: hidden;
  }

  .panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--surface-2);
    overflow: hidden;
  }

  .panel form {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--size-3);
    background: var(--surface-3);
    border-bottom: 1px solid var(--border-subtle);
  }

  .panel-title {
    font-size: var(--font-size-1);
    font-weight: var(--font-weight-6);
    color: var(--text-2);
  }

  .status-indicators {
    display: flex;
    gap: var(--size-2);
    align-items: center;
  }

  .panel-content {
    flex: 1;
    overflow: hidden;
    display: flex;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: var(--size-3);
  }

  .auto-transpile-label {
    display: flex;
    align-items: center;
    gap: var(--size-1);
    font-size: var(--font-size-0);
    color: var(--text-3);
    cursor: pointer;
    user-select: none;
  }

  .auto-transpile-label input {
    accent-color: var(--accent);
    cursor: pointer;
  }

  .auto-transpile-label:hover {
    color: var(--text-2);
  }

  .transpile-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .transpile-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .share-btn:hover {
    background: var(--surface-3);
    color: var(--text-1);
  }

  .share-btn .material-symbols-outlined {
    font-size: 18px;
  }

  .error-indicator {
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    color: var(--red-5);
    padding: var(--size-1) var(--size-2);
    background: color-mix(in srgb, var(--red-5) 15%, transparent);
    border-radius: var(--radius-2);
  }

  .warning-indicator {
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    color: var(--yellow-5);
    padding: var(--size-1) var(--size-2);
    background: color-mix(in srgb, var(--yellow-5) 15%, transparent);
    border-radius: var(--radius-2);
  }

  .warnings-panel {
    background: color-mix(in srgb, var(--yellow-9) 30%, var(--surface-2));
    border-bottom: 1px solid var(--yellow-7);
    padding: var(--size-2) var(--size-3);
    max-height: 120px;
    overflow-y: auto;
  }

  .warning-item {
    display: flex;
    align-items: center;
    gap: var(--size-2);
    padding: var(--size-1) 0;
    font-size: var(--font-size-0);
    color: var(--yellow-3);
    line-height: 1.4;
  }

  .warning-item + .warning-item {
    border-top: 1px solid var(--yellow-8);
    margin-top: var(--size-1);
    padding-top: var(--size-2);
  }

  .warning-icon {
    flex-shrink: 0;
    font-size: 18px;
    line-height: 1;
  }

  .warning-message {
    flex: 1;
    min-width: 0;
  }

  .warning-location {
    flex-shrink: 0;
    font-family: var(--font-mono);
    color: var(--yellow-5);
    font-size: var(--font-size-0);
    padding: var(--size-1) var(--size-2);
    background: color-mix(in srgb, var(--yellow-7) 30%, transparent);
    border-radius: var(--radius-1);
  }

  .error-display,
  .placeholder {
    flex: 1;
    padding: var(--size-3);
    background: var(--code-bg);
    overflow: auto;
  }

  .error-display pre,
  .placeholder pre {
    margin: 0;
    color: var(--red-4);
  }

  .placeholder pre {
    color: var(--text-3);
  }

  .error-display code,
  .placeholder code {
    background: none;
    padding: 0;
    font-family: var(--font-mono);
  }
</style>
