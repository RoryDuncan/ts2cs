import { expect } from "vitest";
import { transpileSource, GENERATED_HEADER } from "../src/transpiler.js";

/**
 * Default namespace used in tests (derived from 'test.ts' filename)
 */
export const TEST_NAMESPACE = "Src";

/**
 * Normalize whitespace for comparison:
 * - Trim leading/trailing whitespace
 * - Normalize line endings to \n
 * - Remove trailing whitespace from each line
 */
export function normalize(code: string): string {
  return code
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Transpile TypeScript source to C#
 */
export function transpile(tsSource: string, config?: Record<string, unknown>): string {
  return transpileSource(tsSource, "test.ts", config);
}

/**
 * Assert that TypeScript input transpiles to expected C# output
 */
export function expectCSharp(tsInput: string, expectedCs: string): void {
  const result = transpile(tsInput);
  expect(normalize(result)).toBe(normalize(expectedCs));
}

/**
 * Assert that TypeScript input transpiles to expected C# output with custom config
 */
export function expectCSharpWithConfig(tsInput: string, expectedCs: string, config: Record<string, unknown>): void {
  const result = transpile(tsInput, config);
  expect(normalize(result)).toBe(normalize(expectedCs));
}

// Re-export GENERATED_HEADER for test convenience
export { GENERATED_HEADER };

/**
 * Wrap content in namespace block for expected output
 * @param content The class/enum/interface content (without header or usings)
 * @param usings Optional array of using statements (without 'using' prefix)
 * @param namespace The namespace to use (defaults to TEST_NAMESPACE)
 */
export function wrapExpected(content: string, usings: string[] = [], namespace: string = TEST_NAMESPACE): string {
  const parts: string[] = [GENERATED_HEADER, ""];

  if (usings.length > 0) {
    parts.push(...usings.map((u) => `using ${u};`));
    parts.push("");
  }

  parts.push(`namespace ${namespace}`);
  parts.push("{");

  // Indent the content
  const contentLines = content.split("\n");
  for (const line of contentLines) {
    if (line.trim() === "") {
      parts.push("");
    } else {
      parts.push(`    ${line}`);
    }
  }

  parts.push("}");

  return parts.join("\n");
}
