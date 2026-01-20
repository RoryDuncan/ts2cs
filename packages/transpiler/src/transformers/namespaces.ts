/**
 * Namespace generation utilities for TypeScript to C# transpilation
 */

import { toPascalCase } from "../utils/naming.js";

/**
 * Derive a C# namespace from a file path relative to the source root
 *
 * Examples:
 * - 'player.ts' with root 'Game' -> 'Game'
 * - 'entities/player.ts' with root 'Game' -> 'Game.Entities'
 * - 'ui/components/button.ts' with root 'Game' -> 'Game.Ui.Components'
 */
export function getNamespaceFromPath(relativePath: string, rootNamespace: string): string {
  // Normalize path separators
  const normalized = relativePath.replace(/\\/g, "/");

  // Get directory parts (exclude filename)
  const parts = normalized.split("/").filter(Boolean);

  // Remove the filename (last part that has an extension or is the file)
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1] ?? "";
    if (lastPart.includes(".") || !lastPart.includes("/")) {
      parts.pop();
    }
  }

  if (parts.length === 0) {
    return rootNamespace;
  }

  // Convert each directory part to PascalCase and build namespace
  const namespaceParts = parts.map((part) => toPascalCase(part));

  return `${rootNamespace}.${namespaceParts.join(".")}`;
}

/**
 * Get the root namespace from config or derive from directory name
 */
export function getRootNamespace(configNamespace?: string, inputDir?: string): string {
  if (configNamespace) {
    return configNamespace;
  }

  if (inputDir) {
    // Get the last part of the input directory and PascalCase it
    const normalized = inputDir.replace(/\\/g, "/").replace(/\/$/, "");
    const parts = normalized.split("/").filter(Boolean);
    const dirName = parts[parts.length - 1];
    if (dirName) {
      return toPascalCase(dirName);
    }
  }

  return "GameScripts";
}

/**
 * Wrap generated C# code in a namespace block
 */
export function wrapInNamespace(code: string, namespace: string): string {
  // Split the code into lines
  const lines = code.split("\n");

  // Separate header, usings, and content
  const headerLines: string[] = [];
  const usings: string[] = [];
  const contentLines: string[] = [];

  let inHeader = true;

  for (const line of lines) {
    // Header comments (lines starting with //)
    if (inHeader && line.startsWith("//")) {
      headerLines.push(line);
      continue;
    }

    // Empty lines in header
    if (inHeader && line.trim() === "") {
      continue;
    }

    // Using statements (can appear after header but before content)
    if (line.startsWith("using ")) {
      inHeader = false;
      usings.push(line);
      continue;
    }

    // Skip empty lines between usings and content
    if (!inHeader && contentLines.length === 0 && line.trim() === "") {
      continue;
    }

    // Content starts here
    inHeader = false;
    contentLines.push(line);
  }

  // Build result with namespace wrapping
  const result: string[] = [];

  // Add header lines
  result.push(...headerLines);

  // Add using statements (outside namespace)
  if (usings.length > 0) {
    result.push("");
    result.push(...usings);
  }

  // Add namespace block
  if (result.length > 0) {
    result.push("");
  }
  result.push(`namespace ${namespace}`);
  result.push("{");

  // Add content with indentation
  for (const line of contentLines) {
    if (line.trim() === "") {
      result.push("");
    } else {
      result.push(`    ${line}`);
    }
  }

  result.push("}");

  return result.join("\n");
}
