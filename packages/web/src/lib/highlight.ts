/**
 * Shiki syntax highlighting utility
 *
 * Provides async code highlighting for TypeScript and C#.
 * Uses a singleton highlighter instance for performance.
 */

import { createHighlighter, type Highlighter } from "shiki";

// Singleton highlighter instance
let highlighterPromise: Promise<Highlighter> | null = null;

// Theme that matches our dark UI
const THEME = "github-dark";

// Languages we support
const LANGUAGES = ["typescript", "csharp", "json"] as const;
export type SupportedLanguage = (typeof LANGUAGES)[number];

/**
 * Get or create the singleton highlighter instance
 */
async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEME],
      langs: [...LANGUAGES]
    });
  }
  return highlighterPromise;
}

/**
 * Highlight code and return HTML string
 *
 * @param code - The code to highlight
 * @param lang - The language ('typescript' or 'csharp')
 * @returns HTML string with syntax highlighting
 */
export async function highlight(code: string, lang: SupportedLanguage): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang,
    theme: THEME
  });
}

/**
 * Check if a language is supported
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return LANGUAGES.includes(lang as SupportedLanguage);
}
