<!--
  CodeBlock - Presentational component for displaying highlighted code

  Props:
    - code: string - The code to display
    - lang: 'typescript' | 'csharp' - Language for syntax highlighting
    - loading?: boolean - Show loading state instead of code

  This is a "dumb" component - it only handles display, no business logic.
-->
<script lang="ts">
  import { highlight, type SupportedLanguage } from "$lib/highlight";

  interface Props {
    code: string;
    lang: SupportedLanguage;
    loading?: boolean;
  }

  let { code, lang, loading = false }: Props = $props();

  let highlightedHtml = $state("");
  let isHighlighting = $state(false);

  // Re-highlight when code or lang changes
  $effect(() => {
    if (code && !loading) {
      isHighlighting = true;
      highlight(code, lang)
        .then((html) => {
          highlightedHtml = html;
        })
        .catch((err) => {
          console.error("Highlighting failed:", err);
          highlightedHtml = `<pre><code>${escapeHtml(code)}</code></pre>`;
        })
        .finally(() => {
          isHighlighting = false;
        });
    } else if (!code) {
      highlightedHtml = "";
    }
  });

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
</script>

<div class="code-block" class:loading={loading || isHighlighting}>
  {#if loading || isHighlighting}
    <div class="loading-indicator">
      <span class="loading-text">...</span>
    </div>
  {:else if highlightedHtml}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- Shiki output is sanitized -->
    {@html highlightedHtml}
  {:else}
    <pre class="empty-state"><code>// No code to display</code></pre>
  {/if}
</div>

<style>
  .code-block {
    flex: 1;
    overflow: auto;
    background: var(--code-bg);
    font-family: var(--font-mono);
    font-size: var(--font-size-1);
    line-height: var(--font-lineheight-3);
  }

  .code-block :global(pre) {
    margin: 0;
    padding: var(--size-3);
    background: transparent !important;
    overflow: visible;
  }

  .code-block :global(code) {
    background: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--size-4);
    color: var(--text-3);
  }

  .loading-text {
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }

  .empty-state {
    margin: 0;
    padding: var(--size-3);
    color: var(--text-3);
  }

  .empty-state code {
    background: none;
    padding: 0;
  }
</style>
