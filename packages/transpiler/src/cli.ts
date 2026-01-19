#!/usr/bin/env node
/**
 * ts2cs CLI
 *
 * Command-line interface for the TypeScript to C# transpiler.
 */

import { cac } from "cac";
import { createTranspiler } from "./index.js";
import { safeParseConfig, type TranspilerConfig } from "./config/schema.js";
import * as fs from "node:fs/promises";
import * as path from "node:path";

// ANSI colors for terminal output (Node.js built-in support)
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m"
};

// Check if colors should be disabled
const noColor = process.env["NO_COLOR"] !== undefined || !process.stdout.isTTY;

function c(color: keyof typeof colors, text: string): string {
  if (noColor) return text;
  return `${colors[color]}${text}${colors.reset}`;
}

interface CLIOptions {
  output: string;
  namespace?: string;
  numberType?: "float" | "double";
  arrayTransform?: "array" | "list" | "godot-array";
  watch?: boolean;
  config?: string;
}

/**
 * Load configuration from a file if it exists
 */
async function loadConfigFile(configPath?: string): Promise<Partial<TranspilerConfig> | null> {
  const configFiles = configPath ? [configPath] : ["ts2cs.config.json", "ts2cs.config.js"];

  for (const file of configFiles) {
    try {
      const fullPath = path.resolve(process.cwd(), file);
      const stat = await fs.stat(fullPath);

      if (stat.isFile()) {
        if (file.endsWith(".json")) {
          const content = await fs.readFile(fullPath, "utf-8");
          return JSON.parse(content) as Partial<TranspilerConfig>;
        } else if (file.endsWith(".js")) {
          // Dynamic import for JS config files
          const module = (await import(fullPath)) as { default?: Partial<TranspilerConfig> };
          return module.default ?? null;
        }
      }
    } catch {
      // File doesn't exist or can't be read, continue to next
    }
  }

  return null;
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const cli = cac("ts2cs");

  cli
    .command("<inputDir>", "Transpile TypeScript files to C# for Godot")
    .option("-o, --output <dir>", "Output directory for generated C# files")
    .option("-n, --namespace <namespace>", "Base C# namespace for generated code")
    .option("--number-type <type>", "C# type for TS number: float (default) or double")
    .option("--array-transform <type>", "Array transform: list (default), array, or godot-array")
    .option("-w, --watch", "Watch for file changes and re-transpile")
    .option("-c, --config <file>", "Path to config file (default: ts2cs.config.json)")
    .action(async (inputDir: string, options: CLIOptions) => {
      try {
        // Validate required options
        if (!options.output) {
          console.error(c("red", "Error: --output option is required"));
          process.exit(1);
        }
        // Load config file if present
        const fileConfig = await loadConfigFile(options.config);

        // Merge configs: CLI options override file config
        const config: Partial<TranspilerConfig> = {
          ...fileConfig,
          inputDir: path.resolve(process.cwd(), inputDir),
          outputDir: path.resolve(process.cwd(), options.output)
        };

        // Apply CLI overrides
        if (options.namespace !== undefined) {
          config.namespace = options.namespace;
        }
        if (options.numberType !== undefined) {
          config.numberType = options.numberType;
        }
        if (options.arrayTransform !== undefined) {
          config.arrayTransform = options.arrayTransform;
        }
        if (options.watch !== undefined) {
          config.watch = options.watch;
        }

        // Validate configuration
        const parseResult = safeParseConfig(config);
        if (!parseResult.success) {
          console.error(c("red", "Error: Invalid configuration"));
          for (const issue of parseResult.issues) {
            console.error(c("red", `  - ${issue.path?.join(".") ?? "config"}: ${issue.message}`));
          }
          process.exit(1);
        }

        console.log(c("cyan", "ts2cs") + c("dim", " - TypeScript to C# transpiler for Godot"));
        console.log("");
        console.log(c("dim", "Input:  ") + config.inputDir);
        console.log(c("dim", "Output: ") + config.outputDir);
        console.log("");

        // Create transpiler and run
        const transpiler = createTranspiler(config);
        const result = await transpiler.transpile();

        // Display results
        if (result.errors.length > 0) {
          console.log(c("red", `✖ Transpilation failed with ${result.errors.length} error(s):`));
          console.log("");

          for (const error of result.errors) {
            console.log(c("red", `  ${error.file}:${error.line}:${error.column}`));
            console.log(c("dim", `    ${error.message}`));
          }

          process.exit(1);
        }

        // Display warnings
        if (result.warnings.length > 0) {
          console.log(c("yellow", `⚠ ${result.warnings.length} warning(s):`));

          for (const warning of result.warnings) {
            console.log(c("yellow", `  ${warning.file}:${warning.line}:${warning.column}`));
            console.log(c("dim", `    ${warning.message}`));
          }

          console.log("");
        }

        // Success summary
        const fileCount = result.files.size;
        console.log(c("green", `✓ Successfully transpiled ${fileCount} file(s)`));

        if (fileCount > 0) {
          console.log(c("dim", "  Files written:"));
          for (const [filePath] of result.files) {
            console.log(c("dim", `    - ${filePath}`));
          }
        }

        // Watch mode
        if (config.watch && config.inputDir) {
          console.log("");
          console.log(c("cyan", "Watching for changes...") + c("dim", " (Press Ctrl+C to stop)"));

          const { watch } = await import("node:fs");
          const inputPath = config.inputDir;
          watch(inputPath, { recursive: true }, async (_eventType: string, filename: string | null) => {
            if (filename && /\.tsx?$/.test(filename) && !filename.endsWith(".d.ts")) {
              console.log(c("dim", `\nFile changed: ${filename}`));
              const watchResult = await transpiler.transpile();

              if (watchResult.errors.length > 0) {
                console.log(c("red", `✖ ${watchResult.errors.length} error(s)`));
              } else {
                console.log(c("green", `✓ Transpiled ${watchResult.files.size} file(s)`));
              }
            }
          });

          // Keep the process running
          await new Promise(() => {});
        }
      } catch (err) {
        console.error(c("red", "Error: ") + (err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  cli.help();
  cli.version("0.1.0");

  // Parse arguments
  cli.parse();
}

// Run the CLI
main().catch((err: unknown) => {
  console.error(c("red", "Fatal error: ") + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
});

