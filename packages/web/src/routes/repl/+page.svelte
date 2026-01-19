<script lang="ts">
  import { PaneGroup, Pane, PaneResizer } from "paneforge";

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

  let csOutput = $state("// Click 'Transpile' to generate C# code");
  let isTranspiling = $state(false);

  async function transpile() {
    isTranspiling = true;
    try {
      const response = await fetch("/api/transpile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tsInput })
      });

      const result = await response.json();

      if (result.error) {
        csOutput = `// Error: ${result.error}`;
      } else {
        csOutput = result.output;
      }
    } catch (err) {
      csOutput = `// Error: ${err instanceof Error ? err.message : String(err)}`;
    } finally {
      isTranspiling = false;
    }
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
          <textarea bind:value={tsInput} class="code-editor" spellcheck="false"></textarea>
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
        </div>
        <div class="panel-content">
          <pre class="code-output"><code>{csOutput}</code></pre>
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

  .panel-content {
    flex: 1;
    overflow: auto;
    display: flex;
  }

  .code-editor {
    flex: 1;
    width: 100%;
    height: 100%;
    padding: var(--size-3);
    background: var(--code-bg);
    color: var(--code-text);
    font-family: var(--font-mono);
    font-size: var(--font-size-1);
    line-height: var(--font-lineheight-3);
    border: none;
    outline: none;
    resize: none;
    tab-size: 2;
  }

  .code-editor::placeholder {
    color: var(--text-3);
  }

  .code-output {
    flex: 1;
    margin: 0;
    padding: var(--size-3);
    background: var(--code-bg);
    color: var(--code-text);
    font-size: var(--font-size-1);
    line-height: var(--font-lineheight-3);
    overflow: auto;
    white-space: pre;
    border-radius: 0;
  }

  .code-output code {
    background: none;
    padding: 0;
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
</style>
