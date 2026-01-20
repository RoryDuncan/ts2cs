import { describe, it, expect } from "vitest";
import { Project } from "ts-morph";
import { transformType } from "../../src/transformers/types.js";
import { getTypeMappings, parseConfig } from "../../src/config/schema.js";
import { expectCSharp, wrapExpected } from "../helpers.js";

function getDefaultMappings() {
  const config = parseConfig({ inputDir: "./src", outputDir: "./out" });
  return getTypeMappings(config);
}

function parseAndTransformType(typeAnnotation: string): string {
  const mappings = getDefaultMappings();
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile("test.ts", `let x: ${typeAnnotation};`);
  const varDecl = sourceFile.getVariableDeclarations()[0];
  const typeNode = varDecl?.getTypeNode();
  return transformType(typeNode, mappings);
}

describe("Async/Await Support", () => {
  describe("Promise type mapping", () => {
    it("should map Promise<string> to Task<string>", () => {
      const result = parseAndTransformType("Promise<string>");
      expect(result).toBe("Task<string>");
    });

    it("should map Promise<number> to Task<float>", () => {
      const result = parseAndTransformType("Promise<number>");
      expect(result).toBe("Task<float>");
    });

    it("should map Promise<void> to Task", () => {
      const result = parseAndTransformType("Promise<void>");
      expect(result).toBe("Task");
    });

    it("should map Promise<boolean> to Task<bool>", () => {
      const result = parseAndTransformType("Promise<boolean>");
      expect(result).toBe("Task<bool>");
    });
  });

  describe("Async methods", () => {
    it("should transpile async method", () => {
      const input = `class DataLoader {
  async loadData(): Promise<string> {
    return "data";
  }
}`;

      const expected = wrapExpected(`public class DataLoader
{
    public async Task<string> loadData()
    {
        return "data";
    }
}`);

      expectCSharp(input, expected);
    });

    it("should transpile async method with Task (void)", () => {
      const input = `class DataLoader {
  async process(): Promise<void> {
  }
}`;

      const expected = wrapExpected(`public class DataLoader
{
    public async Task process()
    {
    }
}`);

      expectCSharp(input, expected);
    });
  });
});

describe("Collection Type Mappings", () => {
  describe("Map", () => {
    it("should map Map<string, number> to Dictionary<string, float>", () => {
      const result = parseAndTransformType("Map<string, number>");
      expect(result).toBe("Dictionary<string, float>");
    });

    it("should map Map<number, string> to Dictionary<float, string>", () => {
      const result = parseAndTransformType("Map<number, string>");
      expect(result).toBe("Dictionary<float, string>");
    });
  });

  describe("Set", () => {
    it("should map Set<string> to HashSet<string>", () => {
      const result = parseAndTransformType("Set<string>");
      expect(result).toBe("HashSet<string>");
    });

    it("should map Set<number> to HashSet<float>", () => {
      const result = parseAndTransformType("Set<number>");
      expect(result).toBe("HashSet<float>");
    });
  });

  describe("Record", () => {
    it("should map Record<string, number> to Dictionary<string, float>", () => {
      const result = parseAndTransformType("Record<string, number>");
      expect(result).toBe("Dictionary<string, float>");
    });

    it("should map Record<string, boolean> to Dictionary<string, bool>", () => {
      const result = parseAndTransformType("Record<string, boolean>");
      expect(result).toBe("Dictionary<string, bool>");
    });
  });

  describe("ReadonlyArray", () => {
    it("should map ReadonlyArray<string> to IReadOnlyList<string>", () => {
      const result = parseAndTransformType("ReadonlyArray<string>");
      expect(result).toBe("IReadOnlyList<string>");
    });
  });

  describe("WeakMap and WeakSet", () => {
    it("should map WeakMap to Dictionary", () => {
      const result = parseAndTransformType("WeakMap<object, string>");
      expect(result).toBe("Dictionary<object, string>");
    });

    it("should map WeakSet to HashSet", () => {
      const result = parseAndTransformType("WeakSet<object>");
      expect(result).toBe("HashSet<object>");
    });
  });
});
