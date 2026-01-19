<script lang="ts">
  import { PaneGroup, Pane, PaneResizer } from "paneforge";
  import CodeEditor from "$lib/components/CodeEditor.svelte";
  import CodeBlock from "$lib/components/CodeBlock.svelte";

  // Types
  interface TranspileWarning {
    message: string;
    line?: number;
    column?: number;
  }

  // Constants
  const MAX_INPUT_LENGTH = 50_000;

  // State
  let tsInput = $state(`class Player extends Node2D {
  health: number = 100;
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
  }

  get isAlive(): boolean {
    return this.health > 0;
  }
}`);

  let csOutput = $state("");
  let isTranspiling = $state(false);
  let error = $state<string | null>(null);
  let warnings = $state<TranspileWarning[]>([]);

  // API call handler (business logic lives in the container)
  async function transpile() {
    if (!tsInput.trim()) {
      error = "Please enter some TypeScript code";
      return;
    }

    isTranspiling = true;
    error = null;
    warnings = [];

    try {
      const response = await fetch("/api/transpile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tsInput })
      });

      const result = await response.json();

      if (!response.ok) {
        error = result.error || `Server error: ${response.status}`;
        csOutput = "";
        warnings = result.warnings || [];
      } else if (result.error) {
        error = result.error;
        csOutput = "";
        warnings = result.warnings || [];
      } else {
        csOutput = result.output;
        warnings = result.warnings || [];
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      csOutput = "";
      warnings = [];
    } finally {
      isTranspiling = false;
    }
  }

  // Helper to format warning location
  function formatWarningLocation(warning: TranspileWarning): string {
    if (warning.line && warning.column) {
      return `Line ${warning.line}, Column ${warning.column}`;
    } else if (warning.line) {
      return `Line ${warning.line}`;
    }
    return "";
  }
</script>

<svelte:head>
  <title>REPL - ts2cs</title>
</svelte:head>

<div class="repl-container">
  <PaneGroup direction="horizontal" class="pane-group">
    <Pane defaultSize={50} minSize={20} class="pane">
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">TypeScript</span>
          <button type="button" class="transpile-btn" disabled={isTranspiling} onclick={transpile}>
            {isTranspiling ? "..." : "Transpile"}
          </button>
        </div>
        <div class="panel-content">
          <CodeEditor
            bind:value={tsInput}
            lang="typescript"
            maxlength={MAX_INPUT_LENGTH}
            placeholder="Enter TypeScript code..."
            disabled={isTranspiling}
          />
        </div>
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

  :global(.pane-group) {
    flex: 1;
    display: flex;
  }

  :global(.pane) {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :global(.resizer) {
    width: 8px;
    background: var(--surface-3);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: col-resize;
    transition: background 0.15s ease;
  }

  :global(.resizer:hover),
  :global(.resizer[data-dragging="true"]) {
    background: var(--accent);
  }

  .resizer-handle {
    width: 2px;
    height: 32px;
    background: var(--surface-4);
    border-radius: var(--radius-2);
  }

  :global(.resizer:hover) .resizer-handle,
  :global(.resizer[data-dragging="true"]) .resizer-handle {
    background: var(--gray-9);
  }

  .panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--surface-2);
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--size-3);
    background: var(--surface-3);
    border-bottom: 1px solid var(--border-subtle);
  }

  .panel-title {
    font-family: var(--font-mono);
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

  .transpile-btn {
    padding: var(--size-1) var(--size-3);
    background: var(--accent);
    color: var(--gray-9);
    border: none;
    border-radius: var(--radius-2);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-6);
    cursor: pointer;
    transition: background 0.15s ease;
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
</style>
