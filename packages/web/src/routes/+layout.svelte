<script lang="ts">
  import "open-props/style";
  import "open-props/normalize";
  import "open-props/normalize.dark.min.css";
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { page } from "$app/state";

  let { children } = $props();

  const navLinks = [
    { href: "/repl", label: "REPL", external: false },
    { href: "/features", label: "Features", external: false },
    { href: "/docs", label: "Docs", external: false },
    { href: "https://github.com/RoryDuncan/ts2cs", label: "GitHub", external: true }
  ];
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>ts2cs - TypeScript to C# Transpiler for Godot</title>
  <meta name="description" content="Transpile TypeScript to Godot-compatible C# scripts" />
</svelte:head>

<div class="app">
  {#if !page.url.searchParams.has("embed")}
    <header class="site-header">
      <nav class="container">
        <a href="/" class="logo">ts2cs</a>
        <ul class="nav-links">
          {#each navLinks as link (link.href)}
            <li>
              <a
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener" : undefined}
              >
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      </nav>
    </header>
  {/if}

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
    font-family: var(--font-brand);
    font-size: var(--font-size-4);
    color: var(--text-1);
  }

  .logo:hover {
    color: var(--accent-hover);
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
