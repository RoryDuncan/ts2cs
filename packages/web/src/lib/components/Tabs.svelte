<!--
  Tabs - File-like tab navigation component
  
  Props:
    - tabs: Array of { id: string, label: string } - Tab definitions
    - activeTab: string - Currently active tab id (bindable)
-->
<script lang="ts">
  interface Tab {
    id: string;
    label: string;
  }

  interface Props {
    tabs: Tab[];
    activeTab: string;
  }

  let { tabs, activeTab = $bindable() }: Props = $props();

  function handleTabClick(tabId: string) {
    activeTab = tabId;
  }

  function handleKeyDown(event: KeyboardEvent, tabId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activeTab = tabId;
    }
  }
</script>

<div class="tabs" role="tablist">
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      role="tab"
      class="tab"
      class:active={tab.id === activeTab}
      aria-selected={tab.id === activeTab}
      tabindex={tab.id === activeTab ? 0 : -1}
      onclick={() => handleTabClick(tab.id)}
      onkeydown={(e) => handleKeyDown(e, tab.id)}
    >
      <span class="tab-icon">📄</span>
      <span class="tab-label">{tab.label}</span>
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    gap: 0;
    background: var(--surface-3);
    border-bottom: 1px solid var(--border-subtle);
    overflow-x: auto;
    scrollbar-width: thin;
    align-items: end;
    height: 100%;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: var(--size-2);
    padding: var(--size-2) var(--size-3);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-3);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;
    position: relative;
    border-radius: 3px;
    border-bottom-right-radius: 0px;
    border-bottom-left-radius: 0px;
  }

  .tab:hover {
    color: var(--text-2);
    background: var(--surface-4);
  }

  .tab.active {
    color: var(--orange-1);
    border-bottom-color: var(--stone-7);
  }

  .tab-icon {
    font-size: 14px;
    line-height: 1;
  }

  .tab-label {
    line-height: 1;
  }

  /* Scrollbar styling for overflow */
  .tabs::-webkit-scrollbar {
    height: 4px;
  }

  .tabs::-webkit-scrollbar-track {
    background: var(--surface-3);
  }

  .tabs::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 2px;
  }
</style>
