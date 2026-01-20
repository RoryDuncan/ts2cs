/**
 * ts2cs-transpiler
 *
 * TypeScript to C# transpiler for Godot 4.x
 *
 * This module provides the main API for transpiling TypeScript code
 * to Godot-compatible C# scripts.
 */

import { parseConfig as parseConfigFn, type TranspilerConfig } from "./config/schema.js";
import { createContext, transpileSourceFileWithWarnings } from "./transpiler.js";
import { Project } from "ts-morph";
import * as fs from "node:fs/promises";
import * as path from "node:path";

export {
  TranspilerConfigSchema,
  parseConfig,
  safeParseConfig,
  getTypeMappings,
  getNamespace
} from "./config/schema.js";
export type { TranspilerConfig, TypeMappings, NumberType } from "./config/schema.js";

// Re-export transpile functions for quick usage
export {
  transpileSource,
  transpileSourceWithWarnings,
  GENERATED_HEADER,
  PROJECT_NAME
} from "./transpiler.js";

export type {
  TranspileContext,
  TranspileResult as TranspileSourceResult,
  TranspileWarning as TranspileSourceWarning
} from "./transpiler.js";

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
    const files = new Map<string, string>();
    const errors: TranspileError[] = [];
    const warnings: TranspileWarning[] = [];

    // Find all TypeScript files in the input directory
    const tsFiles = await findTypeScriptFiles(this.config.inputDir);

    if (tsFiles.length === 0) {
      return { success: true, files, errors, warnings };
    }

    // Create a ts-morph project with all files
    const project = new Project({
      compilerOptions: {
        target: 99, // ESNext
        module: 99, // ESNext
        strict: true,
        experimentalDecorators: true
      }
    });

    // Add all source files to the project
    for (const tsFile of tsFiles) {
      project.addSourceFileAtPath(tsFile);
    }

    // Transpile each file
    for (const tsFile of tsFiles) {
      const sourceFile = project.getSourceFile(tsFile);
      if (!sourceFile) continue;

      // Calculate relative path from input dir
      const relativePath = path.relative(this.config.inputDir, tsFile);

      try {
        const context = createContext(this.config, relativePath);
        const result = transpileSourceFileWithWarnings(sourceFile, context);

        // Calculate output path
        const outputRelativePath = relativePath.replace(/\.tsx?$/, ".cs");
        const outputPath = path.join(this.config.outputDir, outputRelativePath);

        // Store the transpiled content
        files.set(outputPath, result.code);

        // Convert internal warnings to public format
        for (const w of result.warnings) {
          warnings.push({
            file: tsFile,
            line: w.line ?? 1,
            column: w.column ?? 1,
            message: w.message,
            code: "TS2CS_WARNING"
          });
        }
      } catch (err) {
        errors.push({
          file: tsFile,
          line: 1,
          column: 1,
          message: err instanceof Error ? err.message : String(err),
          code: "TS2CS_ERROR"
        });
      }
    }

    // Write output files if there are no errors
    if (errors.length === 0) {
      await writeOutputFiles(files, this.config.outputDir);
    }

    return {
      success: errors.length === 0,
      files,
      errors,
      warnings
    };
  }

  /**
   * Transpile a single TypeScript source string
   */
  transpileSource(source: string, fileName = "source.ts"): TranspileResult {
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // ESNext
        module: 99, // ESNext
        strict: true,
        experimentalDecorators: true
      }
    });

    const sourceFile = project.createSourceFile(fileName, source);
    const context = createContext(this.config, fileName);
    const result = transpileSourceFileWithWarnings(sourceFile, context);

    // Convert output filename from .ts to .cs
    const outputFileName = fileName.replace(/\.ts?$/, ".cs");

    // Convert internal warnings to public warning format
    const warnings: TranspileWarning[] = result.warnings.map((w) => ({
      file: fileName,
      line: w.line ?? 1,
      column: w.column ?? 1,
      message: w.message,
      code: "TS2CS_WARNING"
    }));

    return {
      success: true,
      files: new Map([[outputFileName, result.code]]),
      errors: [],
      warnings
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

/**
 * Recursively find all TypeScript files in a directory
 */
async function findTypeScriptFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry.name === "node_modules" || entry.name.startsWith(".")) {
          continue;
        }
        const subFiles = await findTypeScriptFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or is not readable
  }

  return files;
}

/**
 * Write all output files to the output directory
 */
async function writeOutputFiles(files: Map<string, string>, _outputDir: string): Promise<void> {
  for (const [filePath, content] of files) {
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write the file
    await fs.writeFile(filePath, content, "utf-8");
  }
}
