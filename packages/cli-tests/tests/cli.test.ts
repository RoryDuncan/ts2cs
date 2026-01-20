import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execa, type ExecaError } from "execa";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, "../../transpiler/dist/cli.cjs");
const FIXTURES_PATH = path.resolve(__dirname, "../fixtures");

// Temp output directory for tests
let tempDir: string;

async function runCli(args: string[], options: { cwd?: string } = {}): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const result = await execa("node", [CLI_PATH, ...args], {
      cwd: options.cwd ?? tempDir,
      env: { ...process.env, NO_COLOR: "1" } // Disable colors for easier assertion
    });
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (error) {
    const execaError = error as ExecaError;
    return {
      stdout: execaError.stdout as string ?? "",
      stderr: execaError.stderr as string ?? "",
      exitCode: execaError.exitCode ?? 1
    };
  }
}

async function createTempDir(): Promise<string> {
  const dir = path.join(__dirname, "..", ".temp", `test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

describe("CLI", () => {
  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe("--help", () => {
    it("displays help information", async () => {
      const result = await runCli(["--help"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("ts2cs");
      expect(result.stdout).toContain("--output");
      expect(result.stdout).toContain("--namespace");
      expect(result.stdout).toContain("--number-type");
      expect(result.stdout).toContain("--array-transform");
      expect(result.stdout).toContain("--watch");
      expect(result.stdout).toContain("--config");
    });

    it("displays help with -h shorthand", async () => {
      const result = await runCli(["-h"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("ts2cs");
    });
  });

  describe("--version", () => {
    it("displays version number", async () => {
      const result = await runCli(["--version"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });

    it("displays version with -v shorthand", async () => {
      const result = await runCli(["-v"]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe("--output (required)", () => {
    it("fails when --output is not provided", async () => {
      const inputDir = path.join(FIXTURES_PATH, "basic");
      const result = await runCli([inputDir]);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("--output option is required");
    });

    it("creates output directory if it does not exist", async () => {
      const inputDir = path.join(FIXTURES_PATH, "basic");
      const outputDir = path.join(tempDir, "nested", "output");
      const result = await runCli([inputDir, "-o", outputDir]);

      expect(result.exitCode).toBe(0);
      const outputExists = await fs.stat(outputDir).then(() => true).catch(() => false);
      expect(outputExists).toBe(true);
    });
  });

  describe("basic transpilation", () => {
    it("transpiles a single file", async () => {
      const inputDir = path.join(FIXTURES_PATH, "basic");
      const outputDir = path.join(tempDir, "output");
      const result = await runCli([inputDir, "-o", outputDir]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Successfully transpiled");
      expect(result.stdout).toContain("1 file(s)");

      // Check output file exists
      const outputFile = path.join(outputDir, "Player.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      expect(outputContent).toContain("class Player");
      expect(outputContent).toContain("string name");
      expect(outputContent).toContain("void takeDamage");
    });

    it("transpiles multiple files in nested directories", async () => {
      const inputDir = path.join(FIXTURES_PATH, "multi-file");
      const outputDir = path.join(tempDir, "output");
      const result = await runCli([inputDir, "-o", outputDir]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Successfully transpiled");
      expect(result.stdout).toContain("2 file(s)");

      // Check both output files exist
      const entityFile = path.join(outputDir, "Entity.cs");
      const healthFile = path.join(outputDir, "components", "Health.cs");

      expect(await fs.stat(entityFile).then(() => true).catch(() => false)).toBe(true);
      expect(await fs.stat(healthFile).then(() => true).catch(() => false)).toBe(true);
    });

    it("handles empty input directory", async () => {
      const emptyDir = path.join(tempDir, "empty-input");
      await fs.mkdir(emptyDir, { recursive: true });
      const outputDir = path.join(tempDir, "output");

      const result = await runCli([emptyDir, "-o", outputDir]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Successfully transpiled 0 file(s)");
    });
  });

  describe("--namespace", () => {
    it("uses custom namespace when provided", async () => {
      const inputDir = path.join(FIXTURES_PATH, "basic");
      const outputDir = path.join(tempDir, "output");
      const result = await runCli([inputDir, "-o", outputDir, "--namespace", "MyGame.Core"]);

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, "Player.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      expect(outputContent).toContain("namespace MyGame.Core");
    });

    it("uses -n shorthand for namespace", async () => {
      const inputDir = path.join(FIXTURES_PATH, "basic");
      const outputDir = path.join(tempDir, "output");
      const result = await runCli([inputDir, "-o", outputDir, "-n", "ShortNs"]);

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, "Player.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      expect(outputContent).toContain("namespace ShortNs");
    });
  });

  describe("--number-type", () => {
    it("uses float by default", async () => {
      const inputDir = path.join(FIXTURES_PATH, "basic");
      const outputDir = path.join(tempDir, "output");
      const result = await runCli([inputDir, "-o", outputDir]);

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, "Player.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      expect(outputContent).toContain("float health");
    });

    it("uses double when --number-type double is specified", async () => {
      const inputDir = path.join(FIXTURES_PATH, "basic");
      const outputDir = path.join(tempDir, "output");
      const result = await runCli([inputDir, "-o", outputDir, "--number-type", "double"]);

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, "Player.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      expect(outputContent).toContain("double health");
    });
  });

  describe("--array-transform", () => {
    it("uses List<T> by default", async () => {
      const inputDir = path.join(FIXTURES_PATH, "with-arrays");
      const outputDir = path.join(tempDir, "output");
      const result = await runCli([inputDir, "-o", outputDir]);

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, "ArrayTest.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      expect(outputContent).toContain("List<string>");
      expect(outputContent).toContain("List<float>");
    });

    it("uses native arrays when --array-transform array is specified", async () => {
      const inputDir = path.join(FIXTURES_PATH, "with-arrays");
      const outputDir = path.join(tempDir, "output");
      const result = await runCli([inputDir, "-o", outputDir, "--array-transform", "array"]);

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, "ArrayTest.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      expect(outputContent).toContain("string[]");
      expect(outputContent).toContain("float[]");
    });

    it("uses Godot arrays when --array-transform godot-array is specified", async () => {
      const inputDir = path.join(FIXTURES_PATH, "with-arrays");
      const outputDir = path.join(tempDir, "output");
      const result = await runCli([inputDir, "-o", outputDir, "--array-transform", "godot-array"]);

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, "ArrayTest.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      expect(outputContent).toContain("Array<string>");
      expect(outputContent).toContain("Array<float>");
    });
  });

  describe("--config", () => {
    it("loads settings from ts2cs.config.json", async () => {
      const inputDir = path.join(FIXTURES_PATH, "with-config", "src");
      const outputDir = path.join(tempDir, "output");
      const configDir = path.join(FIXTURES_PATH, "with-config");

      const result = await runCli([inputDir, "-o", outputDir], { cwd: configDir });

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, "Game.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      // Config specifies namespace: "ConfiguredNamespace"
      expect(outputContent).toContain("namespace ConfiguredNamespace");
      // Config specifies numberType: "double"
      expect(outputContent).toContain("double score");
      // Config specifies arrayTransform: "array"
      expect(outputContent).toContain("string[]");
    });

    it("CLI options override config file settings", async () => {
      const inputDir = path.join(FIXTURES_PATH, "with-config", "src");
      const outputDir = path.join(tempDir, "output");
      const configDir = path.join(FIXTURES_PATH, "with-config");

      // Config has namespace: "ConfiguredNamespace", but we override with CLI
      const result = await runCli([inputDir, "-o", outputDir, "--namespace", "OverriddenNs"], { cwd: configDir });

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, "Game.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      expect(outputContent).toContain("namespace OverriddenNs");
    });

    it("loads custom config file with -c option", async () => {
      // Create a custom config file in temp dir
      const customConfig = path.join(tempDir, "custom.config.json");
      await fs.writeFile(customConfig, JSON.stringify({
        namespace: "CustomConfigNs",
        numberType: "double"
      }));

      const inputDir = path.join(FIXTURES_PATH, "basic");
      const outputDir = path.join(tempDir, "output");

      const result = await runCli([inputDir, "-o", outputDir, "-c", customConfig]);

      expect(result.exitCode).toBe(0);

      const outputFile = path.join(outputDir, "Player.cs");
      const outputContent = await fs.readFile(outputFile, "utf-8");

      expect(outputContent).toContain("namespace CustomConfigNs");
      expect(outputContent).toContain("double health");
    });
  });

  describe("error handling", () => {
    it("fails gracefully for non-existent input directory", async () => {
      const inputDir = path.join(tempDir, "does-not-exist");
      const outputDir = path.join(tempDir, "output");

      const result = await runCli([inputDir, "-o", outputDir]);

      // Should succeed with 0 files (empty directory behavior)
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Successfully transpiled 0 file(s)");
    });

    it("displays file paths in output", async () => {
      const inputDir = path.join(FIXTURES_PATH, "basic");
      const outputDir = path.join(tempDir, "output");

      const result = await runCli([inputDir, "-o", outputDir]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Files written:");
      expect(result.stdout).toContain("Player.cs");
    });
  });
});

