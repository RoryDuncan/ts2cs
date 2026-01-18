import { describe, it, expect, vi } from 'vitest';
import { expectCSharp, GENERATED_HEADER } from '../helpers.js';
import { transpileSourceFileWithWarnings, createContext } from '../../src/transpiler.js';
import { Project } from 'ts-morph';

/**
 * Tests for TypeScript statement transpilation to C#
 */

describe('Statements', () => {
  describe('Variable declarations', () => {
    it('should transpile let with initializer', () => {
      const input = `class Counter {
  increment(): void {
    let x = 5;
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class Counter
{
    public void Increment()
    {
        var x = 5;
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile const with initializer', () => {
      const input = `class Counter {
  getValue(): number {
    const PI = 3.14;
    return PI;
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class Counter
{
    public float GetValue()
    {
        var PI = 3.14;
        return PI;
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile typed variable without initializer', () => {
      const input = `class Counter {
  process(): void {
    let count: number;
    count = 10;
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class Counter
{
    public void Process()
    {
        float count;
        count = 10;
    }
}`;

      expectCSharp(input, expected);
    });
  });

  describe('Operators', () => {
    it('should transpile === to ==', () => {
      const input = `class Checker {
  isEqual(a: number, b: number): boolean {
    return a === b;
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class Checker
{
    public bool IsEqual(float a, float b)
    {
        return a == b;
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile !== to !=', () => {
      const input = `class Checker {
  isNotEqual(a: number, b: number): boolean {
    return a !== b;
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class Checker
{
    public bool IsNotEqual(float a, float b)
    {
        return a != b;
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile ** to Mathf.Pow', () => {
      const input = `class MathUtils {
  power(base: number, exp: number): number {
    return base ** exp;
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class MathUtils
{
    public float Power(float @base, float exp)
    {
        return Mathf.Pow(@base, exp);
    }
}`;

      expectCSharp(input, expected);
    });
  });

  describe('Control flow - if/else', () => {
    it('should transpile simple if statement', () => {
      const input = `class Guard {
  check(x: number): void {
    if (x > 0) {
      return;
    }
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class Guard
{
    public void Check(float x)
    {
        if (x > 0)
        {
            return;
        }
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile if-else statement', () => {
      const input = `class Guard {
  check(x: number): string {
    if (x > 0) {
      return "positive";
    } else {
      return "non-positive";
    }
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class Guard
{
    public string Check(float x)
    {
        if (x > 0)
        {
            return "positive";
        }
        else
        {
            return "non-positive";
        }
    }
}`;

      expectCSharp(input, expected);
    });
  });

  describe('Control flow - for loops', () => {
    it('should transpile for loop', () => {
      const input = `class Counter {
  count(): void {
    for (let i = 0; i < 10; i++) {
      continue;
    }
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class Counter
{
    public void Count()
    {
        for (var i = 0; i < 10; i++)
        {
            continue;
        }
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile for-of to foreach', () => {
      const input = `class Iterator {
  process(items: string[]): void {
    for (const item of items) {
      break;
    }
  }
}`;

      const expected = `${GENERATED_HEADER}

using System.Collections.Generic;

public partial class Iterator
{
    public void Process(List<string> items)
    {
        foreach (var item in items)
        {
            break;
        }
    }
}`;

      expectCSharp(input, expected);
    });
  });

  describe('Control flow - while loops', () => {
    it('should transpile while loop', () => {
      const input = `class Runner {
  run(): void {
    let running = true;
    while (running) {
      running = false;
    }
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class Runner
{
    public void Run()
    {
        var running = true;
        while (running)
        {
            running = false;
        }
    }
}`;

      expectCSharp(input, expected);
    });
  });

  describe('Special function calls', () => {
    it('should transpile console.log to GD.Print', () => {
      const input = `class Logger {
  log(msg: string): void {
    console.log(msg);
  }
}`;

      const expected = `${GENERATED_HEADER}

public partial class Logger
{
    public void Log(string msg)
    {
        GD.Print(msg);
    }
}`;

      expectCSharp(input, expected);
    });
  });

  describe('Top-level statement warnings', () => {
    it('should warn about top-level variable declaration', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `const x = 5;`);
      const context = createContext();
      
      const result = transpileSourceFileWithWarnings(sourceFile, context);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('Top-level statement skipped');
    });

    it('should warn about top-level expression statement', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `console.log("hello");`);
      const context = createContext();
      
      const result = transpileSourceFileWithWarnings(sourceFile, context);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('Top-level statement skipped');
    });

    it('should not warn about class declarations', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `class Player {}`);
      const context = createContext();
      
      const result = transpileSourceFileWithWarnings(sourceFile, context);
      
      expect(result.warnings.length).toBe(0);
    });

    it('should not warn about import declarations', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `import { Node2D } from 'godot';`);
      const context = createContext();
      
      const result = transpileSourceFileWithWarnings(sourceFile, context);
      
      expect(result.warnings.length).toBe(0);
    });
  });
});

