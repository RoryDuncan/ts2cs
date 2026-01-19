import { describe, it, expect } from "vitest";
import { transpileSource } from "../../src/transpiler.js";
import { wrapExpected, TEST_NAMESPACE } from "../helpers.js";

/**
 * Helper to compare transpiled output
 */
function expectCSharp(input: string, expected: string, config?: Record<string, unknown>) {
  const result = transpileSource(input, "test.ts", config);
  expect(result.trim()).toBe(expected.trim());
}

describe("Array Transform Configuration", () => {
  describe("arrayTransform: list (default)", () => {
    it("should transpile number[] to List<float>", () => {
      const input = `class Player {
  scores: number[];
}`;
      const expected = wrapExpected(
        `public partial class Player
{
    public List<float> scores;
}`,
        ["System.Collections.Generic"]
      );
      expectCSharp(input, expected);
    });

    it("should transpile string[] to List<string>", () => {
      const input = `class Player {
  names: string[];
}`;
      const expected = wrapExpected(
        `public partial class Player
{
    public List<string> names;
}`,
        ["System.Collections.Generic"]
      );
      expectCSharp(input, expected);
    });

    it("should transpile Array<T> to List<T>", () => {
      const input = `class Player {
  items: Array<string>;
}`;
      const expected = wrapExpected(
        `public partial class Player
{
    public List<string> items;
}`,
        ["System.Collections.Generic"]
      );
      expectCSharp(input, expected);
    });

    it("should initialize empty array as new List<T>()", () => {
      const input = `class Player {
  scores: number[] = [];
}`;
      const expected = wrapExpected(
        `public partial class Player
{
    public List<float> scores = new List<float>();
}`,
        ["System.Collections.Generic"]
      );
      expectCSharp(input, expected);
    });

    it("should initialize non-empty array as new List<T> { ... }", () => {
      const input = `class Player {
  scores: number[] = [1, 2, 3];
}`;
      const expected = wrapExpected(
        `public partial class Player
{
    public List<float> scores = new List<float> { 1, 2, 3 };
}`,
        ["System.Collections.Generic"]
      );
      expectCSharp(input, expected);
    });
  });

  describe("arrayTransform: array", () => {
    it("should transpile number[] to float[]", () => {
      const input = `class Player {
  scores: number[];
}`;
      const expected = wrapExpected(`public partial class Player
{
    public float[] scores;
}`);
      expectCSharp(input, expected, { arrayTransform: "array" });
    });

    it("should transpile string[] to string[]", () => {
      const input = `class Player {
  names: string[];
}`;
      const expected = wrapExpected(`public partial class Player
{
    public string[] names;
}`);
      expectCSharp(input, expected, { arrayTransform: "array" });
    });

    it("should transpile Array<T> to T[]", () => {
      const input = `class Player {
  items: Array<string>;
}`;
      const expected = wrapExpected(`public partial class Player
{
    public string[] items;
}`);
      expectCSharp(input, expected, { arrayTransform: "array" });
    });

    it("should initialize empty array as new T[] { }", () => {
      const input = `class Player {
  scores: number[] = [];
}`;
      const expected = wrapExpected(`public partial class Player
{
    public float[] scores = new float[] { };
}`);
      expectCSharp(input, expected, { arrayTransform: "array" });
    });

    it("should initialize non-empty array as new[] { ... }", () => {
      const input = `class Player {
  scores: number[] = [1, 2, 3];
}`;
      const expected = wrapExpected(`public partial class Player
{
    public float[] scores = new[] { 1, 2, 3 };
}`);
      expectCSharp(input, expected, { arrayTransform: "array" });
    });
  });

  describe("arrayTransform: godot-array", () => {
    it("should transpile number[] to Godot.Collections.Array<float>", () => {
      const input = `class Player {
  scores: number[];
}`;
      const expected = wrapExpected(
        `public partial class Player
{
    public Godot.Collections.Array<float> scores;
}`,
        ["Godot.Collections"]
      );
      expectCSharp(input, expected, { arrayTransform: "godot-array" });
    });

    it("should transpile string[] to Godot.Collections.Array<string>", () => {
      const input = `class Player {
  names: string[];
}`;
      const expected = wrapExpected(
        `public partial class Player
{
    public Godot.Collections.Array<string> names;
}`,
        ["Godot.Collections"]
      );
      expectCSharp(input, expected, { arrayTransform: "godot-array" });
    });

    it("should initialize empty array as new Godot.Collections.Array<T>()", () => {
      const input = `class Player {
  scores: number[] = [];
}`;
      const expected = wrapExpected(
        `public partial class Player
{
    public Godot.Collections.Array<float> scores = new Godot.Collections.Array<float>();
}`,
        ["Godot.Collections"]
      );
      expectCSharp(input, expected, { arrayTransform: "godot-array" });
    });

    it("should initialize non-empty array as new Godot.Collections.Array<T> { ... }", () => {
      const input = `class Player {
  scores: number[] = [1, 2, 3];
}`;
      const expected = wrapExpected(
        `public partial class Player
{
    public Godot.Collections.Array<float> scores = new Godot.Collections.Array<float> { 1, 2, 3 };
}`,
        ["Godot.Collections"]
      );
      expectCSharp(input, expected, { arrayTransform: "godot-array" });
    });
  });

  describe("TypedArray transforms", () => {
    describe("typedArrayTransform: array (default)", () => {
      it("should transpile Int32Array to int[]", () => {
        const input = `class Buffer {
  data: Int32Array;
}`;
        const expected = wrapExpected(`public partial class Buffer
{
    public int[] data;
}`);
        expectCSharp(input, expected);
      });

      it("should transpile Float64Array to double[]", () => {
        const input = `class Buffer {
  data: Float64Array;
}`;
        const expected = wrapExpected(`public partial class Buffer
{
    public double[] data;
}`);
        expectCSharp(input, expected);
      });

      it("should transpile Uint8Array to byte[]", () => {
        const input = `class Buffer {
  data: Uint8Array;
}`;
        const expected = wrapExpected(`public partial class Buffer
{
    public byte[] data;
}`);
        expectCSharp(input, expected);
      });

      it("should transpile Float32Array to float[]", () => {
        const input = `class Buffer {
  data: Float32Array;
}`;
        const expected = wrapExpected(`public partial class Buffer
{
    public float[] data;
}`);
        expectCSharp(input, expected);
      });

      it("should transpile Int16Array to short[]", () => {
        const input = `class Buffer {
  data: Int16Array;
}`;
        const expected = wrapExpected(`public partial class Buffer
{
    public short[] data;
}`);
        expectCSharp(input, expected);
      });

      it("should transpile BigInt64Array to long[]", () => {
        const input = `class Buffer {
  data: BigInt64Array;
}`;
        const expected = wrapExpected(`public partial class Buffer
{
    public long[] data;
}`);
        expectCSharp(input, expected);
      });
    });

    describe("typedArrayTransform: span", () => {
      it("should transpile Int32Array to Span<int>", () => {
        const input = `class Buffer {
  data: Int32Array;
}`;
        const expected = wrapExpected(`public partial class Buffer
{
    public Span<int> data;
}`);
        expectCSharp(input, expected, { typedArrayTransform: "span" });
      });

      it("should transpile Float64Array to Span<double>", () => {
        const input = `class Buffer {
  data: Float64Array;
}`;
        const expected = wrapExpected(`public partial class Buffer
{
    public Span<double> data;
}`);
        expectCSharp(input, expected, { typedArrayTransform: "span" });
      });

      it("should transpile Uint8Array to Span<byte>", () => {
        const input = `class Buffer {
  data: Uint8Array;
}`;
        const expected = wrapExpected(`public partial class Buffer
{
    public Span<byte> data;
}`);
        expectCSharp(input, expected, { typedArrayTransform: "span" });
      });
    });
  });

  describe("Combined configurations", () => {
    it("should use array transform for regular arrays and typed transform for typed arrays", () => {
      const input = `class DataProcessor {
  values: number[];
  buffer: Int32Array;
}`;
      const expected = wrapExpected(`public partial class DataProcessor
{
    public float[] values;
    public Span<int> buffer;
}`);
      expectCSharp(input, expected, {
        arrayTransform: "array",
        typedArrayTransform: "span"
      });
    });

    it("should apply list transform with array typed transform", () => {
      const input = `class DataProcessor {
  values: number[];
  buffer: Int32Array;
}`;
      const expected = wrapExpected(
        `public partial class DataProcessor
{
    public List<float> values;
    public int[] buffer;
}`,
        ["System.Collections.Generic"]
      );
      expectCSharp(input, expected, {
        arrayTransform: "list",
        typedArrayTransform: "array"
      });
    });
  });

  describe("Method parameters with arrays", () => {
    it("should apply arrayTransform to method parameter arrays", () => {
      const input = `class Utils {
  sum(values: number[]): number {
    return 0;
  }
}`;
      const expected = wrapExpected(
        `public partial class Utils
{
    public float sum(List<float> values)
    {
        return 0;
    }
}`,
        ["System.Collections.Generic"]
      );
      expectCSharp(input, expected);
    });

    // Note: Return statement array literals use simple array syntax because
    // the expression context doesn't have access to the return type.
    // This is a known limitation - users should assign to a variable first
    // or use explicit type construction for empty arrays.
    it("should apply arrayTransform to method return types (non-empty)", () => {
      const input = `class Utils {
  getItems(): string[] {
    return ["a", "b"];
  }
}`;
      const expected = wrapExpected(
        `public partial class Utils
{
    public List<string> getItems()
    {
        return new[] { "a", "b" };
    }
}`,
        ["System.Collections.Generic"]
      );
      expectCSharp(input, expected);
    });
  });

  describe("Nested arrays", () => {
    it("should handle nested arrays with list transform", () => {
      const input = `class Matrix {
  data: number[][];
}`;
      const expected = wrapExpected(
        `public partial class Matrix
{
    public List<List<float>> data;
}`,
        ["System.Collections.Generic"]
      );
      expectCSharp(input, expected);
    });

    it("should handle nested arrays with array transform", () => {
      const input = `class Matrix {
  data: number[][];
}`;
      const expected = wrapExpected(`public partial class Matrix
{
    public float[][] data;
}`);
      expectCSharp(input, expected, { arrayTransform: "array" });
    });
  });
});
