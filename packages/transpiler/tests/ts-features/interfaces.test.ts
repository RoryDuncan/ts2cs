import { describe, it } from "vitest";
import { expectCSharp, wrapExpected } from "../helpers.js";

/**
 * Tests for TypeScript interface transpilation to C#
 */

describe("Interfaces", () => {
  describe("Basic interfaces", () => {
    it("should transpile interface with properties", () => {
      const input = `interface IPlayer {
  name: string;
  health: number;
}`;

      const expected = wrapExpected(`public interface IPlayer
{
    string name { get; set; }
    float health { get; set; }
}`);

      expectCSharp(input, expected);
    });

    it("should add I prefix if missing", () => {
      const input = `interface Player {
  name: string;
}`;

      const expected = wrapExpected(`public interface IPlayer
{
    string name { get; set; }
}`);

      expectCSharp(input, expected);
    });

    it("should transpile interface with methods", () => {
      const input = `interface IEntity {
  getName(): string;
  setHealth(value: number): void;
}`;

      // Interface methods preserve original names like class methods
      const expected = wrapExpected(`public interface IEntity
{
    string getName();
    void setHealth(float value);
}`);

      expectCSharp(input, expected);
    });

    it("should transpile interface with optional properties", () => {
      const input = `interface IConfig {
  name: string;
  debug?: boolean;
}`;

      const expected = wrapExpected(`public interface IConfig
{
    string name { get; set; }
    bool? debug { get; set; }
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Interface inheritance", () => {
    it("should transpile interface extending another interface", () => {
      const input = `interface IPlayer extends IEntity {
  score: number;
}`;

      const expected = wrapExpected(`public interface IPlayer : IEntity
{
    float score { get; set; }
}`);

      expectCSharp(input, expected);
    });

    it("should transpile interface extending interface without I prefix", () => {
      const input = `interface Player extends Entity {
  score: number;
}`;

      const expected = wrapExpected(`public interface IPlayer : IEntity
{
    float score { get; set; }
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Generic interfaces", () => {
    it("should transpile generic interface", () => {
      const input = `interface IRepository<T> {
  get(id: string): T;
  save(item: T): void;
}`;

      const expected = wrapExpected(`public interface IRepository<T>
{
    T get(string id);
    void save(T item);
}`);

      expectCSharp(input, expected);
    });
  });
});
