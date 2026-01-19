import { describe, it } from 'vitest';
import { expectCSharp, expectCSharpWithConfig, wrapExpected } from '../helpers.js';

/**
 * Tests for edge cases and potential bugs
 */

describe('Edge Cases', () => {
  describe('C# Keyword Escaping', () => {
    it('should escape parameter named "base"', () => {
      const input = `class Player extends Node2D {
  takeDamage(base: number): void {
  }
}`;

      const expected = wrapExpected(`public partial class Player : Node2D
{
    public void takeDamage(float @base)
    {
    }
}`, ['Godot']);

      expectCSharp(input, expected);
    });

    it('should escape parameter named "event"', () => {
      const input = `class Entity {
  setType(event: string): void {
  }
}`;

      const expected = wrapExpected(`public partial class Entity
{
    public void setType(string @event)
    {
    }
}`);

      expectCSharp(input, expected);
    });

    it('should escape multiple keyword parameters', () => {
      const input = `class Utils {
  process(event: string, base: number, object: boolean): void {
  }
}`;

      const expected = wrapExpected(`public partial class Utils
{
    public void process(string @event, float @base, bool @object)
    {
    }
}`);

      expectCSharp(input, expected);
    });

    it('should escape property named "event"', () => {
      const input = `class Handler {
  event: string;
}`;

      const expected = wrapExpected(`public partial class Handler
{
    public string @event;
}`);

      expectCSharp(input, expected);
    });

    it('should escape property named "namespace"', () => {
      const input = `class Config {
  namespace: string = "default";
}`;

      const expected = wrapExpected(`public partial class Config
{
    public string @namespace = "default";
}`);

      expectCSharp(input, expected);
    });

    it('should not escape non-keyword names', () => {
      const input = `class Player {
  health: number;
  name: string;
}`;

      const expected = wrapExpected(`public partial class Player
{
    public float health;
    public string name;
}`);

      expectCSharp(input, expected);
    });
  });

  describe('Empty Array Type Inference', () => {
    it('should generate typed empty array for string[] with native array config', () => {
      const input = `class Inventory {
  items: string[] = [];
}`;

      const expected = wrapExpected(`public partial class Inventory
{
    public string[] items = new string[] { };
}`);

      expectCSharpWithConfig(input, expected, { arrayTransform: 'array' });
    });

    it('should generate typed empty array for number[] with native array config', () => {
      const input = `class Stats {
  scores: number[] = [];
}`;

      const expected = wrapExpected(`public partial class Stats
{
    public float[] scores = new float[] { };
}`);

      expectCSharpWithConfig(input, expected, { arrayTransform: 'array' });
    });

    it('should generate typed empty array for custom type with native array config', () => {
      const input = `class Team {
  players: Player[] = [];
}`;

      const expected = wrapExpected(`public partial class Team
{
    public Player[] players = new Player[] { };
}`);

      expectCSharpWithConfig(input, expected, { arrayTransform: 'array' });
    });

    it('should handle non-empty array literals with native array config', () => {
      const input = `class Config {
  values: number[] = [1, 2, 3];
}`;

      const expected = wrapExpected(`public partial class Config
{
    public float[] values = new[] { 1, 2, 3 };
}`);

      expectCSharpWithConfig(input, expected, { arrayTransform: 'array' });
    });
  });
});
