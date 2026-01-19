<script lang="ts">
  // Docs page - placeholder for now
</script>

<svelte:head>
  <title>Documentation - ts2cs</title>
</svelte:head>

<div class="docs-container container">
  <h1>Documentation</h1>

  <div class="todo-notice">
    <p><strong>TODO:</strong> Documentation is coming soon.</p>
    <p>
      In the meantime, check out the <a href="/repl">REPL</a> to try the transpiler, or view the source on
      <a href="https://github.com/user/ts2cs-godot" target="_blank" rel="noopener">GitHub</a>.
    </p>
  </div>
</div>

<style>
  .docs-container {
    padding-block: var(--size-8);
  }

  .docs-container h1 {
    font-size: var(--font-size-6);
    margin-bottom: var(--size-6);
  }

  .todo-notice {
    background: var(--surface-2);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-2);
    padding: var(--size-5);
    max-width: 600px;
  }

  .todo-notice p {
    margin: 0;
    color: var(--text-2);
  }

  .todo-notice p + p {
    margin-top: var(--size-3);
  }

  .todo-notice strong {
    color: var(--accent);
  }
</style>
