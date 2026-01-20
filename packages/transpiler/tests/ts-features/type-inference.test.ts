import { describe, it } from "vitest";
import { expectCSharp, wrapExpected } from "../helpers.js";

/**
 * Tests for TypeScript type inference transpilation to C#
 * 
 * These tests verify that the transpiler correctly uses TypeScript's type
 * inference capabilities via ts-morph to generate valid C# code.
 */

describe("Type Inference", () => {
  describe("Async method return type inference", () => {
    it("should infer Task for async void methods without explicit return type", () => {
      const input = `class DataLoader {
  async process() {
    return;
  }
}`;

      const expected = wrapExpected(`public class DataLoader
{
    public async Task process()
    {
        return;
    }
}`);

      expectCSharp(input, expected);
    });

    it("should infer Task<string> for async methods returning string", () => {
      const input = `class DataLoader {
  async getData() {
    return "hello";
  }
}`;

      const expected = wrapExpected(`public class DataLoader
{
    public async Task<string> getData()
    {
        return "hello";
    }
}`);

      expectCSharp(input, expected);
    });

    it("should infer Task<float> for async methods returning number", () => {
      const input = `class Calculator {
  async compute() {
    return 42;
  }
}`;

      const expected = wrapExpected(`public class Calculator
{
    public async Task<float> compute()
    {
        return 42;
    }
}`);

      expectCSharp(input, expected);
    });

    it("should infer Task for async methods with no return statement", () => {
      const input = `class Processor {
  async doWork() {
    console.log("working");
  }
}`;

      const expected = wrapExpected(`public class Processor
{
    public async Task doWork()
    {
        GD.Print("working");
    }
}`);

      expectCSharp(input, expected);
    });

    it("should still use explicit Promise<T> return type when provided", () => {
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
  });

  describe("Sync method return type inference", () => {
    it("should infer string return type from return statement", () => {
      const input = `class Greeter {
  greet() {
    return "hello";
  }
}`;

      const expected = wrapExpected(`public class Greeter
{
    public string greet()
    {
        return "hello";
    }
}`);

      expectCSharp(input, expected);
    });

    it("should infer number (float) return type from return statement", () => {
      const input = `class Calculator {
  getValue() {
    return 42;
  }
}`;

      const expected = wrapExpected(`public class Calculator
{
    public float getValue()
    {
        return 42;
    }
}`);

      expectCSharp(input, expected);
    });

    it("should infer boolean return type from return statement", () => {
      const input = `class Validator {
  isValid() {
    return true;
  }
}`;

      const expected = wrapExpected(`public class Validator
{
    public bool isValid()
    {
        return true;
    }
}`);

      expectCSharp(input, expected);
    });

    it("should infer void when no return value", () => {
      const input = `class Logger {
  log() {
    console.log("test");
  }
}`;

      const expected = wrapExpected(`public class Logger
{
    public void log()
    {
        GD.Print("test");
    }
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Arrow function type inference", () => {
    it("should infer Func<T> for simple arrow functions", () => {
      const input = `class Game {
  play() {
    const getName = () => "player";
  }
}`;

      const expected = wrapExpected(`public class Game
{
    public void play()
    {
        Func<string> getName = () => "player";
    }
}`);

      expectCSharp(input, expected);
    });

    it("should infer Action for void arrow functions", () => {
      const input = `class Game {
  setup() {
    const doNothing = () => { };
  }
}`;

      const expected = wrapExpected(`public class Game
{
    public void setup()
    {
        Action doNothing = () => { };
    }
}`);

      expectCSharp(input, expected);
    });

    it("should infer Func with parameters", () => {
      const input = `class Math {
  setup() {
    const add = (a: number, b: number) => a + b;
  }
}`;

      const expected = wrapExpected(`public class Math
{
    public void setup()
    {
        Func<float, float, float> add = (float a, float b) => a + b;
    }
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Object literal handling", () => {
    it("should transform object literals to anonymous types", () => {
      const input = `class Factory {
  create() {
    const obj = { name: "test", value: 42 };
  }
}`;

      const expected = wrapExpected(`public class Factory
{
    public void create()
    {
        var obj = new { name = "test", value = 42 };
    }
}`);

      expectCSharp(input, expected);
    });

    it("should handle satisfies operator by removing it", () => {
      const input = `interface Dog { name: string; }
class Factory {
  create() {
    const dog = { name: "Buddy" } satisfies Dog;
  }
}`;

      const expected = wrapExpected(`public interface IDog
{
    string name { get; set; }
}

public class Factory
{
    public void create()
    {
        var dog = new { name = "Buddy" };
    }
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Type assertions", () => {
    it("should transform 'as' type assertions", () => {
      const input = `class Parser {
  parse(value: object) {
    const str = value as string;
  }
}`;

      const expected = wrapExpected(`public class Parser
{
    public void parse(object value)
    {
        var str = value as string;
    }
}`);

      expectCSharp(input, expected);
    });

    it("should handle non-null assertion operator", () => {
      const input = `class Reader {
  read(value: string | null) {
    const str = value!;
  }
}`;

      const expected = wrapExpected(`public class Reader
{
    public void read(string? value)
    {
        var str = value!;
    }
}`);

      expectCSharp(input, expected);
    });
  });
});

