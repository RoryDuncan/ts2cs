import { describe, it } from 'vitest';
import { expectCSharp, wrapExpected } from '../helpers.js';

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

      const expected = wrapExpected(`public enum Direction
{
    Up,
    Down,
    Left,
    Right
}`);

      expectCSharp(input, expected);
    });

    it('should transpile enum with explicit values', () => {
      const input = `enum Status {
  Pending = 0,
  Active = 1,
  Completed = 2
}`;

      const expected = wrapExpected(`public enum Status
{
    Pending = 0,
    Active = 1,
    Completed = 2
}`);

      expectCSharp(input, expected);
    });

    it('should transpile enum with mixed values', () => {
      const input = `enum Priority {
  Low,
  Medium = 5,
  High
}`;

      const expected = wrapExpected(`public enum Priority
{
    Low,
    Medium = 5,
    High
}`);

      expectCSharp(input, expected);
    });
  });

  describe('String enums', () => {
    it('should transpile string enum to static class', () => {
      const input = `enum Color {
  Red = "RED",
  Blue = "BLUE",
  Green = "GREEN"
}`;

      const expected = wrapExpected(`public static class Color
{
    public const string Red = "RED";
    public const string Blue = "BLUE";
    public const string Green = "GREEN";
}`);

      expectCSharp(input, expected);
    });
  });

  describe('Const enums', () => {
    it('should handle const enum as regular enum', () => {
      const input = `const enum Direction {
  Up,
  Down,
  Left,
  Right
}`;

      // Const enums in TS are inlined, but in C# we generate a regular enum
      const expected = wrapExpected(`public enum Direction
{
    Up,
    Down,
    Left,
    Right
}`);

      expectCSharp(input, expected);
    });
  });
});
