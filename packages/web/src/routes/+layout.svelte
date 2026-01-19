<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>ts2cs - TypeScript to C# Transpiler for Godot</title>
  <meta name="description" content="Transpile TypeScript to Godot-compatible C# scripts" />
</svelte:head>

<div class="app">
  <header class="site-header">
    <nav class="container">
      <a href="/" class="logo">ts2cs</a>
      <ul class="nav-links">
        <li><a href="/repl">REPL</a></li>
        <li><a href="/docs">Docs</a></li>
        <li>
          <a href="https://github.com/user/ts2cs-godot" target="_blank" rel="noopener"> GitHub </a>
        </li>
      </ul>
    </nav>
  </header>

  <main>
    {@render children()}
  </main>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .site-header {
    background: var(--surface-2);
    border-bottom: 1px solid var(--border-subtle);
    padding-block: var(--size-3);
  }

  .site-header nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--size-4);
  }

  .logo {
    font-family: var(--font-mono);
    font-size: var(--font-size-4);
    font-weight: var(--font-weight-7);
    color: var(--text-1);
  }

  .logo:hover {
    color: var(--accent);
    text-decoration: none;
  }

  .nav-links {
    display: flex;
    gap: var(--size-5);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-links a {
    color: var(--text-2);
    font-size: var(--font-size-1);
    font-weight: var(--font-weight-5);
  }

  .nav-links a:hover {
    color: var(--text-1);
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>
