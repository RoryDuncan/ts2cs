import { describe, it } from "vitest";
import { expectCSharp, wrapExpected } from "../helpers.js";

describe("Class Transpilation", () => {
  describe("Godot class inheritance", () => {
    it("should transpile class extending Node2D with using Godot", () => {
      const input = `class Player extends Node2D {
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile class extending Node with using Godot", () => {
      const input = `class GameManager extends Node {
}`;

      const expected = wrapExpected(
        `public partial class GameManager : Node
{
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile class extending CharacterBody2D with using Godot", () => {
      const input = `class Enemy extends CharacterBody2D {
}`;

      const expected = wrapExpected(
        `public partial class Enemy : CharacterBody2D
{
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile class extending Control with using Godot", () => {
      const input = `class MainMenu extends Control {
}`;

      const expected = wrapExpected(
        `public partial class MainMenu : Control
{
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile class extending Resource with using Godot", () => {
      const input = `class ItemData extends Resource {
}`;

      const expected = wrapExpected(
        `public partial class ItemData : Resource
{
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });
  });

  describe("Non-Godot class inheritance", () => {
    it("should transpile class extending custom base without using Godot", () => {
      const input = `class Enemy extends BaseEnemy {
}`;

      const expected = wrapExpected(`public partial class Enemy : BaseEnemy
{
}`);

      expectCSharp(input, expected);
    });

    it("should transpile class extending custom base class", () => {
      const input = `class SpecialItem extends Item {
}`;

      const expected = wrapExpected(`public partial class SpecialItem : Item
{
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Multiple classes in one file", () => {
    it("should transpile multiple classes extending Godot types", () => {
      const input = `class Player extends Node2D {
}

class Enemy extends CharacterBody2D {
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
}

public partial class Enemy : CharacterBody2D
{
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should add using Godot if any class extends Godot type", () => {
      const input = `class Player extends Node2D {
}

class HelperClass extends BaseHelper {
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
}

public partial class HelperClass : BaseHelper
{
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should not add using Godot if no class extends Godot type", () => {
      const input = `class Enemy extends BaseEnemy {
}

class Item extends BaseItem {
}`;

      const expected = wrapExpected(`public partial class Enemy : BaseEnemy
{
}

public partial class Item : BaseItem
{
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Classes without inheritance", () => {
    it("should transpile class without base class", () => {
      const input = `class Utility {
}`;

      const expected = wrapExpected(`public partial class Utility
{
}`);

      expectCSharp(input, expected);
    });

    it("should transpile multiple classes without base classes", () => {
      const input = `class UtilityA {
}

class UtilityB {
}`;

      const expected = wrapExpected(`public partial class UtilityA
{
}

public partial class UtilityB
{
}`);

      expectCSharp(input, expected);
    });
  });
});
