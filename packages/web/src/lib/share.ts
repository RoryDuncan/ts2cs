/**
 * Utilities for sharing REPL state via URL
 *
 * Uses LZ-String compression for compact, URL-safe encoding.
 * This is the same approach used by TypeScript Playground.
 */

import LZString from "lz-string";

/**
 * Configuration options that can be shared via URL
 */
export interface ShareableConfig {
  namespace?: string;
  numberType?: "float" | "double";
  arrayTransform?: "array" | "list" | "godot-array";
  typedArrayTransform?: "array" | "span";
  discriminatedUnionStrategy?: "abstract-subclass" | "tagged-struct";
  includeHeader?: boolean;
}

/**
 * Data structure for sharing both code and config
 */
export interface ShareData {
  code: string;
  config?: ShareableConfig;
}

/**
 * Encode code string to a compressed, URL-safe format
 * @deprecated Use encodeShareData for new code
 */
export function encodeCode(code: string): string {
  return LZString.compressToEncodedURIComponent(code);
}

/**
 * Decode compressed URL-safe string back to code
 * @deprecated Use decodeShareData for new code
 */
export function decodeCode(encoded: string): string | null {
  try {
    const result = LZString.decompressFromEncodedURIComponent(encoded);
    // decompressFromEncodedURIComponent returns null on failure
    return result;
  } catch {
    return null;
  }
}

/**
 * Encode share data (code + config) to a compressed, URL-safe format
 */
export function encodeShareData(data: ShareData): string {
  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decode compressed URL-safe string back to share data
 * Also handles legacy format (plain code string) for backward compatibility
 */
export function decodeShareData(encoded: string): ShareData | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    if (!decompressed) {
      return null;
    }

    // Try to parse as JSON (new format)
    try {
      const parsed = JSON.parse(decompressed);
      // Validate it has the expected structure
      if (typeof parsed === "object" && parsed !== null && typeof parsed.code === "string") {
        return {
          code: parsed.code,
          config: parsed.config
        };
      }
    } catch {
      // Not JSON - treat as legacy plain code string
    }

    // Legacy format: plain code string
    return {
      code: decompressed,
      config: undefined
    };
  } catch {
    return null;
  }
}

/**
 * Build a shareable URL with encoded code and config
 */
export function buildShareUrl(data: ShareData, baseUrl: `/${string}/[[share_code]]`): string {
  const encoded = encodeShareData(data);
  return baseUrl.replace("[[share_code]]", encoded);
}

/**
 * Parse shared code from URL params
 * Returns the decoded share data or null if not present/invalid
 */
export function parseShareParams(searchParams: URLSearchParams): ShareData | null {
  const encoded = searchParams.get("code");
  if (!encoded) {
    return null;
  }
  return decodeShareData(encoded);
}

/**
 * Default configuration for the REPL
 */
export const DEFAULT_CONFIG: ShareableConfig = {
  namespace: "Game",
  numberType: "float",
  arrayTransform: "list",
  typedArrayTransform: "array",
  discriminatedUnionStrategy: "abstract-subclass",
  includeHeader: false
};

/**
 * Convert ShareableConfig to a pretty-printed JSON string for editing
 */
export function configToJson(config: ShareableConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Parse JSON string to ShareableConfig, returns null if invalid
 */
export function jsonToConfig(json: string): ShareableConfig | null {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    // Basic validation of known fields
    const config: ShareableConfig = {};
    if (typeof parsed.namespace === "string") {
      config.namespace = parsed.namespace;
    }
    if (parsed.numberType === "float" || parsed.numberType === "double") {
      config.numberType = parsed.numberType;
    }
    if (["array", "list", "godot-array"].includes(parsed.arrayTransform)) {
      config.arrayTransform = parsed.arrayTransform;
    }
    if (parsed.typedArrayTransform === "array" || parsed.typedArrayTransform === "span") {
      config.typedArrayTransform = parsed.typedArrayTransform;
    }
    if (parsed.discriminatedUnionStrategy === "abstract-subclass" || parsed.discriminatedUnionStrategy === "tagged-struct") {
      config.discriminatedUnionStrategy = parsed.discriminatedUnionStrategy;
    }
    if (typeof parsed.includeHeader === "boolean") {
      config.includeHeader = parsed.includeHeader;
    }
    return config;
  } catch {
    return null;
  }
}
