/**
 * Utilities for sharing REPL state via URL
 *
 * Uses LZ-String compression for compact, URL-safe encoding.
 * This is the same approach used by TypeScript Playground.
 */

import LZString from "lz-string";

/**
 * Encode code string to a compressed, URL-safe format
 */
export function encodeCode(code: string): string {
  return LZString.compressToEncodedURIComponent(code);
}

/**
 * Decode compressed URL-safe string back to code
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
 * Build a shareable URL with encoded code
 */
export function buildShareUrl(code: string, baseUrl: `/${string}/[[share_code]]`): string {
  const encoded = encodeCode(code);
  return baseUrl.replace("[[share_code]]", encoded);
}

/**
 * Parse shared code from URL params
 * Returns the decoded code or null if not present/invalid
 */
export function parseShareParams(searchParams: URLSearchParams): string | null {
  const encoded = searchParams.get("code");
  if (!encoded) {
    return null;
  }
  return decodeCode(encoded);
}
