<script lang="ts">
  import "$lib/css/panes.css";
  import { PaneGroup, Pane, PaneResizer } from "paneforge";
  import { enhance } from "$app/forms";
  import CodeEditor from "$lib/components/CodeEditor.svelte";
  import Tabs from "$lib/components/Tabs.svelte";
  import { buildShareUrl, configToJson, jsonToConfig, type ShareableConfig } from "$lib/share";
  import { replaceState } from "$app/navigation";
  import type { RouteId, SubmitFunction } from "./$types";
  import { onMount } from "svelte";

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

  // Tab definitions
  const inputTabs = [
    { id: "typescript", label: "src/example.ts" },
    { id: "config", label: "ts2cs.config.json" }
  ];

  // State - initialize from server data
  let tsInput = $state(data.tsInput);
  let csOutput = $state(data.csOutput);
  let error = $state<string | null>(data.error);
  let warnings = $state<TranspileWarning[]>(data.warnings);
  let isTranspiling = $state(false);
  let autoTranspile = $state(true);
  let activeInputTab = $state<string>("typescript");
  let configJson = $state(configToJson(data.config));
  let configError = $state<string | null>(null);

  // Form reference for programmatic submission
  let formEl: HTMLFormElement;

  // Debounce timer for auto-transpile
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastInput = tsInput;
  let lastConfig = configJson;

  // Auto-transpile effect - track tsInput, configJson, and autoTranspile
  $effect(() => {
    const input = tsInput;
    const config = configJson;
    const auto = autoTranspile;

    // Only trigger if input or config actually changed
    if (input !== lastInput || config !== lastConfig) {
      lastInput = input;
      lastConfig = config;

      // Validate config when it changes
      if (config !== lastConfig) {
        const parsed = jsonToConfig(config);
        configError = parsed === null && config.trim() ? "Invalid JSON" : null;
      }

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

  // Get current config from JSON string
  function getCurrentConfig(): ShareableConfig {
    const parsed = jsonToConfig(configJson);
    return parsed ?? data.defaultConfig;
  }

  const enhancedSubmit: SubmitFunction = () => {
    isTranspiling = true;
    error = null;

    const currentConfig = getCurrentConfig();
    const shareData = { code: tsInput, config: currentConfig };

    if (tsInput === data.defaultCode && JSON.stringify(currentConfig) === JSON.stringify(data.defaultConfig)) {
      replaceState("/repl", {});
    } else {
      const baseUrl: RouteId = "/repl/[[share_code]]";
      const shareUrl = buildShareUrl(shareData, baseUrl);
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

  let direction = $state<"horizontal" | "vertical">("horizontal");

  onMount(() => {
    const mm = window.matchMedia("(min-width: 1200px)");

    mm.addEventListener("change", (ev) => {
      direction = ev.matches ? "horizontal" : "vertical";
    });

    if (mm.matches) {
      direction = "horizontal";
    }
  });
</script>

<svelte:head>
  <title>REPL - ts2cs</title>
</svelte:head>

<div class="repl-container">
  <PaneGroup {direction} class="pane-group">
    <Pane defaultSize={50} minSize={20} class="pane">
      <div class="panel">
        <form method="POST" action="?/transpile" bind:this={formEl} use:enhance={enhancedSubmit}>
          <div class="panel-header">
            <Tabs tabs={inputTabs} bind:activeTab={activeInputTab} />
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
            <input type="hidden" name="config" value={configJson} />

            {#if activeInputTab === "typescript"}
              <CodeEditor
                bind:value={tsInput}
                lang="typescript"
                maxlength={MAX_INPUT_LENGTH}
                placeholder="Enter TypeScript code..."
                disabled={isTranspiling}
              />
            {:else if activeInputTab === "config"}
              <div class="config-editor-wrapper">
                {#if configError}
                  <div class="config-error-banner">
                    <span class="material-symbols-outlined">error</span>
                    <span>{configError}</span>
                  </div>
                {/if}
                <CodeEditor
                  bind:value={configJson}
                  lang="json"
                  placeholder="Enter configuration JSON..."
                  disabled={isTranspiling}
                />
              </div>
            {/if}
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
          <Tabs
            tabs={[
              {
                id: "output",
                label: "src/example.cs"
              }
            ]}
            activeTab={"output"}
          />
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
            <CodeEditor disabled={true} lang="csharp" value={csOutput}></CodeEditor>
            <!-- <CodeBlock code={csOutput} lang="csharp" loading={isTranspiling} /> -->
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface-3);
    border-bottom: 1px solid var(--border-subtle);
    height: 3rem;
  }

  .status-indicators {
    display: flex;
    gap: var(--size-2);
    align-items: center;
    padding-right: var(--size-3);
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
    padding-right: var(--size-3);
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

  .transpile-btn {
    padding: var(--size-1) var(--size-3);
  }

  .transpile-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .transpile-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

  .config-editor-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .config-error-banner {
    display: flex;
    align-items: center;
    gap: var(--size-2);
    padding: var(--size-2) var(--size-3);
    background: color-mix(in srgb, var(--red-9) 40%, var(--surface-2));
    border-bottom: 1px solid var(--red-7);
    color: var(--red-3);
    font-size: var(--font-size-0);
  }

  .config-error-banner .material-symbols-outlined {
    font-size: 18px;
  }
</style>
