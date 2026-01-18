import { describe, it, expect } from 'vitest';
import { expectCSharp, GENERATED_HEADER } from '../helpers.js';

/**
 * Tests for TypeScript enum transpilation to C#
 */

describe('Enums', () => {
  describe('Basic enums', () => {
    it('should transpile simple enum', () => {
      const input = `enum Direction {
  Up,
  Down,
  Left,
  Right
}`;

      const expected = `${GENERATED_HEADER}

public enum Direction
{
    Up,
    Down,
    Left,
    Right
}`;

      expectCSharp(input, expected);
    });

    it('should transpile enum with explicit values', () => {
      const input = `enum Status {
  Pending = 0,
  Active = 1,
  Completed = 2
}`;

      const expected = `${GENERATED_HEADER}

public enum Status
{
    Pending = 0,
    Active = 1,
    Completed = 2
}`;

      expectCSharp(input, expected);
    });

    it('should transpile enum with mixed values', () => {
      const input = `enum Priority {
  Low,
  Medium = 5,
  High
}`;

      const expected = `${GENERATED_HEADER}

public enum Priority
{
    Low,
    Medium = 5,
    High
}`;

      expectCSharp(input, expected);
    });
  });

  describe('String enums', () => {
    it.todo('should transpile string enum', () => {
      // TypeScript string enums don't have a direct C# equivalent
      // enum Color {
      //   Red = "RED",
      //   Blue = "BLUE"
      // }
      // Options: 
      // 1. Generate static class with string constants
      // 2. Generate enum with [Description] attributes
    });
  });

  describe('Const enums', () => {
    it.todo('should handle const enum', () => {
      // const enum Direction { Up, Down }
      // Const enums are inlined at compile time in TS
      // For C#, we can just generate a regular enum
    });
  });
});

