<script lang="ts">
  // Index page - project overview
</script>

<div class="hero container">
  <h1>ts2cs</h1>
  <p class="tagline">TypeScript to C# for <strong>Godot 4</strong></p>

  <p class="description">Write game logic in TypeScript, transpile to Godot-compatible C#.</p>

  <ul class="features-brief">
    <li class="warning">Early Development</li>
    <li>Godot-ready output</li>
    <li>Full class support</li>
    <li>Type-safe transpilation</li>
  </ul>

  <div class="cta-buttons">
    <a href="/repl" class="btn btn-primary">Try the REPL</a>
    <a href="/docs" class="btn btn-secondary">Read the Docs</a>
  </div>
</div>

<style>
  .hero {
    text-align: center;
    padding-block: var(--size-10) var(--size-8);
    max-width: 600px;
  }

  .hero h1 {
    font-family: var(--font-brand);
    font-size: var(--font-size-8);
    margin-bottom: var(--size-2);
  }

  .tagline {
    font-size: var(--font-size-4);
    color: var(--text-2);
    margin-bottom: var(--size-4);
  }

  .description {
    font-size: var(--font-size-2);
    color: var(--text-3);
    margin-bottom: var(--size-5);
  }

  .features-brief {
    display: flex;
    justify-content: center;
    gap: var(--size-4);
    list-style: none;
    padding: 0;
    margin: 0 0 var(--size-6) 0;
    flex-wrap: wrap;
  }

  .features-brief li {
    color: var(--text-2);
    font-size: var(--font-size-1);
    padding: var(--size-2) var(--size-3);
    background: var(--surface-2);
    border-radius: var(--radius-2);
    border: 1px solid var(--border-subtle);
  }

  .features-brief li.warning {
    background: rgba(255, 100, 100, 0.15);
    border-color: rgba(255, 100, 100, 0.4);
    color: #ff9090;
  }

  .cta-buttons {
    display: flex;
    gap: var(--size-4);
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
