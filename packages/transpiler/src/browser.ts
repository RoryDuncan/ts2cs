/**
 * Browser-compatible entry point for ts2cs-transpiler
 *
 * This module exports only browser-safe functions that don't depend on
 * Node.js-specific modules like fs or path. Use this entry point for
 * web applications.
 *
 * @example
 * ```ts
 * import { transpileSource } from 'ts2cs-transpiler/browser';
 *
 * const csCode = transpileSource(`
 *   class Player extends Node2D {
 *     health: number = 100;
 *   }
 * `);
 * ```
 */

// Core transpilation (uses in-memory filesystem)
export {
  transpileSource,
  transpileSourceWithWarnings,
  transpileSourceFile,
  transpileSourceFileWithWarnings,
  createContext,
  GENERATED_HEADER
} from "./transpiler.js";

export type { TranspileContext, TranspileResult, TranspileWarning } from "./transpiler.js";

// Configuration (no fs dependencies)
export {
  TranspilerConfigSchema,
  parseConfig,
  safeParseConfig,
  getTypeMappings,
  getNamespace
} from "./config/schema.js";

export type { TranspilerConfig, TypeMappings, NumberType, ResolvedTypeMappings } from "./config/schema.js";
