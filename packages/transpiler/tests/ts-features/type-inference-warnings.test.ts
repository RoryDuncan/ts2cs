import { describe, it, expect } from "vitest";
import { Project } from "ts-morph";
import { transpileSourceFileWithWarnings, createContext } from "../../src/transpiler.js";

/**
 * Tests for type inference warnings
 * 
 * These tests verify that the transpiler generates appropriate warnings when
 * type inference is used instead of explicit type annotations.
 */

function transpileWithWarnings(input: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile("test.ts", input);
  const context = createContext();
  return transpileSourceFileWithWarnings(sourceFile, context);
}

describe("Type Inference Warnings", () => {
  describe("Method return type warnings", () => {
    it("should warn when method has no explicit return type", () => {
      const input = `class Greeter {
  greet() {
    return "hello";
  }
}`;

      const result = transpileWithWarnings(input);

      expect(result.warnings.length).toBeGreaterThan(0);
      const methodWarning = result.warnings.find((w) => w.message.includes("Method 'greet'"));
      expect(methodWarning).toBeDefined();
      expect(methodWarning?.message).toContain("no explicit return type");
      expect(methodWarning?.message).toContain("string");
    });

    it("should warn when async method has no explicit return type", () => {
      const input = `class DataLoader {
  async process() {
    return;
  }
}`;

      const result = transpileWithWarnings(input);

      expect(result.warnings.length).toBeGreaterThan(0);
      const methodWarning = result.warnings.find((w) => w.message.includes("Method 'process'"));
      expect(methodWarning).toBeDefined();
      expect(methodWarning?.message).toContain("Task");
    });

    it("should NOT warn when method has explicit return type", () => {
      const input = `class Greeter {
  greet(): string {
    return "hello";
  }
}`;

      const result = transpileWithWarnings(input);

      const methodWarning = result.warnings.find((w) => w.message.includes("Method 'greet'"));
      expect(methodWarning).toBeUndefined();
    });
  });

  describe("Property type warnings", () => {
    it("should warn when property has no explicit type", () => {
      const input = `class Player {
  health = 100;
}`;

      const result = transpileWithWarnings(input);

      expect(result.warnings.length).toBeGreaterThan(0);
      const propWarning = result.warnings.find((w) => w.message.includes("Property 'health'"));
      expect(propWarning).toBeDefined();
      expect(propWarning?.message).toContain("no explicit type annotation");
      expect(propWarning?.message).toContain("float");
    });

    it("should warn when string property has no explicit type", () => {
      const input = `class Player {
  name = "Player 1";
}`;

      const result = transpileWithWarnings(input);

      const propWarning = result.warnings.find((w) => w.message.includes("Property 'name'"));
      expect(propWarning).toBeDefined();
      expect(propWarning?.message).toContain("string");
    });

    it("should NOT warn when property has explicit type", () => {
      const input = `class Player {
  health: number = 100;
}`;

      const result = transpileWithWarnings(input);

      const propWarning = result.warnings.find((w) => w.message.includes("Property 'health'"));
      expect(propWarning).toBeUndefined();
    });
  });

  describe("Variable type warnings", () => {
    it("should warn when arrow function variable has no explicit type", () => {
      const input = `class Game {
  play() {
    const getName = () => "player";
  }
}`;

      const result = transpileWithWarnings(input);

      const varWarning = result.warnings.find((w) => w.message.includes("Variable 'getName'"));
      expect(varWarning).toBeDefined();
      expect(varWarning?.message).toContain("no explicit type annotation");
      expect(varWarning?.message).toContain("Func<string>");
    });

    it("should warn when arrow function with parameters has no explicit type", () => {
      const input = `class Math {
  setup() {
    const add = (a: number, b: number) => a + b;
  }
}`;

      const result = transpileWithWarnings(input);

      const varWarning = result.warnings.find((w) => w.message.includes("Variable 'add'"));
      expect(varWarning).toBeDefined();
      expect(varWarning?.message).toContain("Func<float, float, float>");
    });

    it("should NOT warn for regular variable declarations with var", () => {
      const input = `class Counter {
  count() {
    const x = 5;
  }
}`;

      const result = transpileWithWarnings(input);

      // Regular primitive variables use 'var' which is fine in C#
      const varWarning = result.warnings.find((w) => w.message.includes("Variable 'x'"));
      expect(varWarning).toBeUndefined();
    });
  });

  describe("Warning line numbers", () => {
    it("should include line numbers in warnings", () => {
      const input = `class Player {
  health = 100;
  greet() {
    return "hello";
  }
}`;

      const result = transpileWithWarnings(input);

      const propWarning = result.warnings.find((w) => w.message.includes("Property 'health'"));
      expect(propWarning?.line).toBe(2);

      const methodWarning = result.warnings.find((w) => w.message.includes("Method 'greet'"));
      expect(methodWarning?.line).toBe(3);
    });
  });

  describe("Property type inference correctness", () => {
    it("should correctly infer number as float for property", () => {
      const input = `class Stats {
  score = 42;
}`;

      const result = transpileWithWarnings(input);

      // Check that the output uses float, not object
      expect(result.code).toContain("public float score = 42;");
    });

    it("should correctly infer string for property", () => {
      const input = `class Player {
  name = "test";
}`;

      const result = transpileWithWarnings(input);

      expect(result.code).toContain("public string name = \"test\";");
    });

    it("should correctly infer boolean for property", () => {
      const input = `class Settings {
  enabled = true;
}`;

      const result = transpileWithWarnings(input);

      expect(result.code).toContain("public bool enabled = true;");
    });
  });
});

