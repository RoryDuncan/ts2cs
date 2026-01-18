import { describe, it, expect } from 'vitest';
import { expectCSharp, GENERATED_HEADER } from '../helpers.js';

/**
 * Tests for TypeScript interface transpilation to C#
 */

describe('Interfaces', () => {
  describe('Basic interfaces', () => {
    it('should transpile interface with properties', () => {
      const input = `interface IPlayer {
  name: string;
  health: number;
}`;

      const expected = `${GENERATED_HEADER}

public interface IPlayer
{
    string name { get; set; }
    float health { get; set; }
}`;

      expectCSharp(input, expected);
    });

    it('should add I prefix if missing', () => {
      const input = `interface Player {
  name: string;
}`;

      const expected = `${GENERATED_HEADER}

public interface IPlayer
{
    string name { get; set; }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile interface with methods', () => {
      const input = `interface IEntity {
  getName(): string;
  setHealth(value: number): void;
}`;

      const expected = `${GENERATED_HEADER}

public interface IEntity
{
    string GetName();
    void SetHealth(float value);
}`;

      expectCSharp(input, expected);
    });

    it('should transpile interface with optional properties', () => {
      const input = `interface IConfig {
  name: string;
  debug?: boolean;
}`;

      const expected = `${GENERATED_HEADER}

public interface IConfig
{
    string name { get; set; }
    bool? debug { get; set; }
}`;

      expectCSharp(input, expected);
    });
  });

  describe('Interface inheritance', () => {
    it.todo('should transpile interface extending another interface', () => {
      // interface IPlayer extends IEntity {
      //   score: number;
      // }
      // ->
      // public interface IPlayer : IEntity
      // {
      //     float score { get; set; }
      // }
    });
  });

  describe('Generic interfaces', () => {
    it.todo('should transpile generic interface', () => {
      // interface IRepository<T> {
      //   get(id: string): T;
      //   save(item: T): void;
      // }
    });
  });
});

