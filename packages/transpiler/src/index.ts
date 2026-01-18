/**
 * ts2cs-transpiler
 * 
 * TypeScript to C# transpiler for Godot 4.x
 * 
 * This module provides the main API for transpiling TypeScript code
 * to Godot-compatible C# scripts.
 */

import { 
  parseConfig as parseConfigFn,
  type TranspilerConfig,
} from './config/schema.js';

export { 
  TranspilerConfigSchema, 
  parseConfig, 
  safeParseConfig,
  getTypeMappings,
  getNamespace,
} from './config/schema.js';
export type { TranspilerConfig, TypeMappings, NumberType } from './config/schema.js';

export interface TranspileResult {
  /** Whether the transpilation was successful */
  success: boolean;
  /** Generated C# files (path -> content) */
  files: Map<string, string>;
  /** Any errors encountered during transpilation */
  errors: TranspileError[];
  /** Any warnings generated during transpilation */
  warnings: TranspileWarning[];
}

export interface TranspileError {
  /** Source file where the error occurred */
  file: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed) */
  column: number;
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code: string;
}

export interface TranspileWarning {
  /** Source file where the warning occurred */
  file: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed) */
  column: number;
  /** Warning message */
  message: string;
  /** Warning code for programmatic handling */
  code: string;
}

/**
 * Main transpiler class
 * 
 * @example
 * ```ts
 * import { Transpiler } from 'ts2cs-transpiler';
 * 
 * const transpiler = new Transpiler({
 *   inputDir: './src',
 *   outputDir: './csharp',
 *   namespace: 'MyGame',
 * });
 * 
 * const result = await transpiler.transpile();
 * ```
 */
export class Transpiler {
  readonly config: TranspilerConfig;

  constructor(config: TranspilerConfig) {
    this.config = config;
  }

  /**
   * Transpile all TypeScript files in the input directory
   */
  async transpile(): Promise<TranspileResult> {
    // TODO: Implement transpilation logic using ts-morph
    return {
      success: true,
      files: new Map(),
      errors: [],
      warnings: [],
    };
  }

  /**
   * Transpile a single TypeScript source string
   */
  transpileSource(_source: string, _fileName: string = 'source.ts'): TranspileResult {
    // TODO: Implement single-file transpilation
    return {
      success: true,
      files: new Map(),
      errors: [],
      warnings: [],
    };
  }
}

/**
 * Create a new transpiler instance with validated configuration
 */
export function createTranspiler(config: unknown): Transpiler {
  const validatedConfig = parseConfigFn(config);
  return new Transpiler(validatedConfig);
}
