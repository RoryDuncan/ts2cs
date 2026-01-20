<script lang="ts">
  import featuresData from "./features.json";

  // Group features by category
  const featuresByCategory = featuresData.features.reduce(
    (acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    },
    {} as Record<string, typeof featuresData.features>
  );

  const categories = Object.keys(featuresByCategory).sort();

  // Track selected feature for desktop preview (using repl as unique ID)
  let selectedRepl = $state(featuresData.features[0].repl);

  $effect(() => {
    // Reset to first feature if current selection is invalid
    if (!featuresData.features.some((f) => f.repl === selectedRepl)) {
      selectedRepl = featuresData.features[0].repl;
    }
  });

  function getSelectedFeature() {
    return featuresData.features.find((f) => f.repl === selectedRepl) ?? featuresData.features[0];
  }

  function selectFeature(feature: (typeof featuresData.features)[0]) {
    selectedRepl = feature.repl;
  }

  function isSelected(feature: (typeof featuresData.features)[0]) {
    return feature.repl === selectedRepl;
  }
</script>

<svelte:head>
  <title>Features - ts2cs</title>
  <meta name="description" content="Browse TypeScript to C# transpilation features with live REPL examples" />
</svelte:head>

<div class="features-page">
  <div class="features-container">
    <h1>Features</h1>
    <p class="intro">
      Explore the TypeScript features that ts2cs can transpile to C#.
      <span class="desktop-hint">Select a feature to preview it, or click to open in the full REPL.</span>
      <span class="mobile-hint">Click any feature to see it in action in the REPL.</span>
    </p>

    {#each categories as category}
      <section class="category">
        <h2>{category}</h2>
        <ul class="feature-list">
          {#each featuresByCategory[category] as feature}
            <li>
              <button
                type="button"
                class="feature-button"
                class:selected={isSelected(feature)}
                onclick={() => selectFeature(feature)}
              >
                {feature.feature}
              </button>
              <a href="/repl/{feature.repl}" class="feature-link" aria-label="Open {feature.feature} in REPL"> ↗ </a>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>

  <div class="preview-panel">
    <div class="preview-header">
      <span class="preview-title">{getSelectedFeature().feature}</span>
      <a href="/repl/{getSelectedFeature().repl}" class="open-repl-link">Open in REPL ↗</a>
    </div>
    <iframe src="/repl/{selectedRepl}?embed" title="REPL Preview: {getSelectedFeature().feature}"></iframe>
  </div>
</div>

<style>
  .features-page {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .features-container {
    padding: var(--size-6);
    max-width: 500px;
    overflow-y: auto;
  }

  .features-container h1 {
    font-size: var(--font-size-5);
    margin-bottom: var(--size-3);
  }

  .intro {
    color: var(--text-2);
    margin-bottom: var(--size-5);
    font-size: var(--font-size-0);
  }

  .desktop-hint {
    display: none;
  }

  .mobile-hint {
    display: inline;
  }

  .category {
    margin-bottom: var(--size-5);
  }

  .category h2 {
    font-size: var(--font-size-2);
    color: var(--text-1);
    margin-bottom: var(--size-2);
    padding-bottom: var(--size-2);
    border-bottom: 1px solid var(--border-subtle);
  }

  .feature-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: var(--size-1);
  }

  .feature-list li {
    margin: 0;
    display: flex;
    align-items: stretch;
    gap: 0;
  }

  /* Mobile: show as simple links */
  .feature-button {
    display: none;
  }

  .feature-link {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--size-2) var(--size-3);
    background: var(--surface-2);
    border-radius: var(--radius-2);
    color: var(--text-1);
    transition: background 0.15s ease;
    font-size: var(--font-size-0);
  }

  .feature-link:hover {
    background: var(--surface-3);
    text-decoration: none;
  }

  /* Hide preview panel on mobile */
  .preview-panel {
    display: none;
  }

  /* Desktop layout with iframe preview */
  @media (min-width: 1400px) {
    .features-page {
      gap: 0;
    }

    .features-container {
      flex-shrink: 0;
      border-right: 1px solid var(--border-subtle);
    }

    .desktop-hint {
      display: inline;
    }

    .mobile-hint {
      display: none;
    }

    .feature-list li {
      gap: var(--size-1);
    }

    /* Desktop: show buttons for selection */
    .feature-button {
      display: block;
      flex: 1;
      padding: var(--size-2) var(--size-3);
      background: var(--surface-2);
      border: 1px solid transparent;
      border-radius: var(--radius-2);
      color: var(--text-1);
      text-align: left;
      cursor: pointer;
      transition:
        background 0.15s ease,
        border-color 0.15s ease;
      font-size: var(--font-size-0);
      font-family: inherit;
    }

    .feature-button:hover {
      background: var(--surface-3);
    }

    .feature-button.selected {
      background: var(--surface-3);
      border-color: var(--accent);
    }

    .feature-link {
      flex: 0;
      padding: var(--size-2);
      border-radius: var(--radius-2);
      font-size: var(--font-size-1);
    }

    .preview-panel {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      background: var(--surface-1);
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--size-3) var(--size-4);
      background: var(--surface-2);
      border-bottom: 1px solid var(--border-subtle);
    }

    .preview-title {
      font-weight: var(--font-weight-6);
      color: var(--text-1);
    }

    .open-repl-link {
      font-size: var(--font-size-0);
      color: var(--accent);
    }

    .open-repl-link:hover {
      text-decoration: underline;
    }

    .preview-panel iframe {
      flex: 1;
      width: 100%;
      border: none;
      background: var(--surface-1);
    }
  }
</style>
