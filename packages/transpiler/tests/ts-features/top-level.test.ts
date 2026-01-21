import { describe, it, expect } from "vitest";
import { Project } from "ts-morph";
import { transpileSourceFileWithWarnings, createContext } from "../../src/transpiler.js";
import { expectCSharp, expectCSharpWithConfig, wrapExpected, normalize, transpile } from "../helpers.js";

/**
 * Tests for top-level TypeScript statement support
 */

describe("Top-Level Statements", () => {
  describe("Configuration: enableTopLevel", () => {
    it("should warn about top-level statements when enableTopLevel is false", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile("test.ts", `const x = 5;`);
      const context = createContext({ enableTopLevel: false });

      const result = transpileSourceFileWithWarnings(sourceFile, context);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain("Top-level statement skipped");
    });

    it("should not warn when enableTopLevel is true (default)", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile("test.ts", `const x = 5;`);
      const context = createContext({ enableTopLevel: true });

      const result = transpileSourceFileWithWarnings(sourceFile, context);

      // Should not have the "skipped" warning
      const skipWarnings = result.warnings.filter((w) => w.message.includes("skipped"));
      expect(skipWarnings.length).toBe(0);
    });

    it("should enable top-level by default", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile("test.ts", `const x = 5;`);
      const context = createContext(); // No config

      const result = transpileSourceFileWithWarnings(sourceFile, context);

      // Should not have the "skipped" warning
      const skipWarnings = result.warnings.filter((w) => w.message.includes("skipped"));
      expect(skipWarnings.length).toBe(0);
    });
  });

  describe("Literal Constants", () => {
    it("should transpile literal number const to C# const", () => {
      const input = `const MAX_HEALTH = 100;`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("public const float MAX_HEALTH = 100;");
      expect(result).toContain("public static class TestModule");
    });

    it("should transpile literal string const to C# const", () => {
      const input = `const GREETING = "Hello";`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain('public const string GREETING = "Hello";');
    });

    it("should transpile literal boolean const to C# const", () => {
      const input = `const DEBUG = true;`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("public const bool DEBUG = true;");
    });

    it("should transpile negative number const to C# const", () => {
      const input = `const MIN_VALUE = -1;`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("public const float MIN_VALUE = -1;");
    });
  });

  describe("Non-Literal Constants (static readonly)", () => {
    it("should transpile function call const to static readonly", () => {
      const input = `const CONFIG = getConfig();`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("public static readonly var CONFIG;");
      expect(result).toContain("CONFIG = getConfig();");
    });

    it("should transpile expression const to static readonly", () => {
      const input = `const CALCULATED = 10 + 20;`;

      const result = transpile(input, { enableTopLevel: true });

      // Expression is not a literal, should use static readonly
      expect(result).toContain("public static readonly");
    });
  });

  describe("Variables (let/var)", () => {
    it("should transpile let to static field", () => {
      const input = `let counter = 0;`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("public static float counter = 0;");
    });

    it("should transpile let with string type", () => {
      const input = `let name: string = "default";`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain('public static string name = "default";');
    });

    it("should transpile multiple variables", () => {
      const input = `
let x = 1;
let y = 2;
const MAX = 100;`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("public static float x = 1;");
      expect(result).toContain("public static float y = 2;");
      expect(result).toContain("public const float MAX = 100;");
    });
  });

  describe("Expression Statements", () => {
    it("should add console.log to init", () => {
      const input = `console.log("Module loaded");`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain('GD.Print("Module loaded");');
    });

    it("should add function calls to init", () => {
      const input = `registerPlugin("myPlugin");`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain('registerPlugin("myPlugin");');
    });
  });

  describe("Strategy: lazy (default)", () => {
    it("should use static constructor for lazy strategy", () => {
      const input = `
const CONFIG = loadConfig();
console.log("Loaded");`;

      const result = transpile(input, { enableTopLevel: true, topLevelStrategy: "lazy" });

      expect(result).toContain("static TestModule()");
      expect(result).toContain("CONFIG = loadConfig();");
      expect(result).toContain('GD.Print("Loaded");');
    });

    it("should use static constructor by default", () => {
      const input = `console.log("init");`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("static TestModule()");
    });
  });

  describe("Strategy: manual", () => {
    it("should generate Init() method for manual strategy", () => {
      const input = `
const CONFIG = loadConfig();
console.log("Loaded");`;

      const result = transpile(input, { enableTopLevel: true, topLevelStrategy: "manual" });

      expect(result).toContain("public static void Init()");
      expect(result).toContain("CONFIG = loadConfig();");
      expect(result).not.toContain("static TestModule()");
    });
  });

  describe("Strategy: autoload", () => {
    it("should generate autoload class for autoload strategy", () => {
      const input = `console.log("init");`;

      const result = transpile(input, { enableTopLevel: true, topLevelStrategy: "autoload" });

      expect(result).toContain("public static void Init()");
      expect(result).toContain("public partial class TestModuleAutoload : Node");
      expect(result).toContain("public override void _Ready()");
      expect(result).toContain("TestModule.Init();");
    });

    it("should include setup instructions in comments", () => {
      const input = `const X = 1;`;

      const result = transpile(input, { enableTopLevel: true, topLevelStrategy: "autoload" });

      expect(result).toContain("Add to project.godot");
    });
  });

  describe("Mixed Files", () => {
    it("should handle top-level variables alongside classes", () => {
      const input = `
const MAX_HEALTH = 100;

class Player {
  health: number = MAX_HEALTH;
}`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("public static class TestModule");
      expect(result).toContain("public const float MAX_HEALTH = 100;");
      expect(result).toContain("public class Player");
    });

    it("should keep functions in separate Functions class", () => {
      const input = `
const CONFIG = "default";

function helper(): void {}

class Game {}`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("public static class TestModule");
      expect(result).toContain("public static class TestFunctions");
      expect(result).toContain("public class Game");
    });

    it("should handle enums alongside top-level", () => {
      const input = `
const MAX = 10;

enum Direction {
  Up,
  Down
}`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("public static class TestModule");
      expect(result).toContain("public enum Direction");
    });
  });

  describe("Edge Cases", () => {
    it("should not generate module class when no top-level statements", () => {
      const input = `
class Player {
  health: number = 100;
}`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).not.toContain("Module");
      expect(result).not.toContain("Globals");
      expect(result).toContain("public class Player");
    });

    it("should handle empty file", () => {
      const input = `// Just a comment`;

      const result = transpile(input, { enableTopLevel: true });

      // Should return header only or empty
      expect(result).not.toContain("public static class");
    });

    it("should escape C# keywords in variable names", () => {
      const input = `const @base = 10;`;

      // Note: This should work even without @ in TS
      const input2 = `const event = "click";`;
      const result = transpile(input2, { enableTopLevel: true });

      expect(result).toContain("@event");
    });

    it("should warn about top-level await", () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile("test.ts", `await fetch("url");`);
      const context = createContext({ enableTopLevel: true });

      const result = transpileSourceFileWithWarnings(sourceFile, context);

      const awaitWarnings = result.warnings.filter((w) => w.message.includes("await"));
      expect(awaitWarnings.length).toBeGreaterThan(0);
    });
  });

  describe("Naming Conflicts", () => {
    it("should use Globals suffix when Module conflicts", () => {
      const input = `
const X = 1;

class TestModule {
  value: number = 1;
}`;

      const result = transpile(input, { enableTopLevel: true });

      // Should use TestGlobals instead of TestModule
      expect(result).toContain("TestGlobals");
      expect(result).toContain("class TestModule");
    });
  });

  describe("Type Inference", () => {
    it("should infer number type correctly", () => {
      const input = `const value = 42;`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("float");
    });

    it("should infer string type correctly", () => {
      const input = `const value = "hello";`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("string");
    });

    it("should use explicit type annotation", () => {
      const input = `const value: number = 42;`;

      const result = transpile(input, { enableTopLevel: true });

      expect(result).toContain("float");
    });
  });
});

