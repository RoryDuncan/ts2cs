<!--
  CodeEditor - Presentational component for editable code with CodeMirror 6

  Props:
    - value: string - Current code value (bindable)
    - lang: 'typescript' | 'csharp' - Language for syntax highlighting
    - maxlength?: number - Character limit
    - placeholder?: string - Placeholder text (not used by CodeMirror, kept for API compat)
    - disabled?: boolean - Disable editing

  Events:
    - onchange: Called when value changes
    - oninput: Called on every keystroke

  This is a "dumb" component - it only handles display and emits events.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { Compartment, EditorState, type Extension } from "@codemirror/state";
  import { EditorView, keymap, placeholder as cmPlaceholder, lineNumbers } from "@codemirror/view";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { javascript } from "@codemirror/lang-javascript";
  import { csharp } from "@replit/codemirror-lang-csharp";
  import { coolGlow as currentTheme } from "thememirror";
  import type { SupportedLanguage } from "$lib/highlight";

  interface Props {
    value: string;
    lang: SupportedLanguage;
    maxlength?: number;
    placeholder?: string;
    disabled?: boolean;
    onchange?: (value: string) => void;
    oninput?: (value: string) => void;
  }

  let {
    value = $bindable(""),
    lang,
    maxlength,
    placeholder = "",
    disabled = false,
    onchange,
    oninput
  }: Props = $props();

  let editorContainer: HTMLDivElement;
  let view: EditorView | null = null;

  // Track if we're updating from internal changes to avoid loops
  let isInternalUpdate = false;

  // Compartment for dynamic readonly configuration
  const readOnlyCompartment = new Compartment();

  // Create extensions based on props
  function createExtensions(): Extension[] {
    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      currentTheme,
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isInternalUpdate) {
          const newValue = update.state.doc.toString();
          value = newValue;
          oninput?.(newValue);
          onchange?.(newValue);
        }
      }),
      // Dynamic readonly state
      readOnlyCompartment.of(EditorState.readOnly.of(disabled))
    ];

    // Add placeholder if provided
    if (placeholder) {
      extensions.push(cmPlaceholder(placeholder));
    }

    // Add language support - TypeScript mode works for TS input
    // JSON mode uses JavaScript without TypeScript flag
    // Note: CodeMirror doesn't have a built-in C# mode, but we only edit TS/JSON
    if (lang === "typescript") {
      extensions.push(javascript({ typescript: true }));
    } else if (lang === "json") {
      extensions.push(javascript());
    } else if (lang === "csharp") {
      extensions.push(csharp());
    }

    // Enforce max length
    if (maxlength) {
      extensions.push(
        EditorState.transactionFilter.of((tr) => {
          if (tr.newDoc.length > maxlength) {
            return [];
          }
          return tr;
        })
      );
    }

    return extensions;
  }

  onMount(() => {
    const state = EditorState.create({
      doc: value,
      extensions: createExtensions()
    });

    view = new EditorView({
      state,
      parent: editorContainer
    });

    return () => {
      view?.destroy();
    };
  });

  // Sync external value changes to editor
  $effect(() => {
    if (view && value !== view.state.doc.toString()) {
      isInternalUpdate = true;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value
        }
      });
      isInternalUpdate = false;
    }
  });

  // Reconfigure when disabled changes
  $effect(() => {
    if (view) {
      view.dispatch({
        effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(disabled))
      });
    }
  });

  // Character count helpers
  const charCount = $derived(value.length);
  const isNearLimit = $derived(maxlength ? charCount > maxlength * 0.9 : false);
  const isAtLimit = $derived(maxlength ? charCount >= maxlength : false);
</script>

<div class="code-editor-wrapper">
  <div class="editor-container" bind:this={editorContainer}></div>

  <!-- Character count indicator -->
  {#if maxlength}
    <div class="char-count" class:warning={isNearLimit} class:limit={isAtLimit}>
      {charCount.toLocaleString()} / {maxlength.toLocaleString()}
    </div>
  {/if}
</div>

<style>
  .code-editor-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .editor-container {
    flex: 1;
    overflow: hidden;
  }

  /* CodeMirror container fills parent */
  .editor-container :global(.cm-editor) {
    height: 100%;
    background: var(--code-bg);
  }

  .editor-container :global(.cm-scroller) {
    overflow: auto;
    font-family: var(--font-mono);
    font-size: var(--font-size-1);
    line-height: var(--font-lineheight-3);
  }

  /* Match our theme colors */
  .editor-container :global(.cm-gutters) {
    background: var(--surface-3);
    border-right: 1px solid var(--border-subtle);
    color: var(--text-3);
  }

  .editor-container :global(.cm-activeLineGutter) {
    background: var(--surface-2);
  }

  .editor-container :global(.cm-activeLine) {
    background: color-mix(in srgb, var(--surface-3) 30%, transparent);
  }

  .editor-container :global(.cm-cursor) {
    border-left-color: var(--accent);
    border-left-width: 2px;
  }

  .editor-container :global(.cm-selectionBackground) {
    background: color-mix(in srgb, var(--accent) 30%, transparent) !important;
  }

  .editor-container :global(.cm-focused .cm-selectionBackground) {
    background: color-mix(in srgb, var(--accent) 40%, transparent) !important;
  }

  .editor-container :global(.cm-placeholder) {
    color: var(--text-3);
  }

  .char-count {
    padding: var(--size-1) var(--size-3);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    color: var(--text-3);
    background: var(--surface-3);
    text-align: right;
    border-top: 1px solid var(--border-subtle);
  }

  .char-count.warning {
    color: var(--yellow-5);
  }

  .char-count.limit {
    color: var(--red-5);
  }
</style>
