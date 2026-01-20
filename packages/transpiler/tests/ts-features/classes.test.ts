import { describe, it } from "vitest";
import { expectCSharp, wrapExpected } from "../helpers.js";

/**
 * Tests for TypeScript class feature transpilation to C#
 *
 * Reference: TypeScript Handbook - Classes
 * https://www.typescriptlang.org/docs/handbook/2/classes.html
 */

describe("Class Features", () => {
  describe("Class properties", () => {
    it("should transpile class with typed property", () => {
      const input = `class Player extends Node2D {
  health: number;
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public float health;
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile class with initialized property", () => {
      const input = `class Player extends Node2D {
  health: number = 100;
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public float health = 100;
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile class with multiple properties", () => {
      const input = `class Player extends Node2D {
  health: number = 100;
  name: string = "Player";
  isAlive: boolean = true;
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public float health = 100;
    public string name = "Player";
    public bool isAlive = true;
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile readonly property", () => {
      const input = `class Config {
  readonly maxPlayers: number = 4;
}`;

      const expected = wrapExpected(`public class Config
{
    public readonly float maxPlayers = 4;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile optional property", () => {
      const input = `class Player {
  nickname?: string;
}`;

      const expected = wrapExpected(`public class Player
{
    public string? nickname;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile private property", () => {
      const input = `class Player {
  private _health: number = 100;
}`;

      const expected = wrapExpected(`public class Player
{
    private float _health = 100;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile protected property", () => {
      const input = `class Player {
  protected health: number = 100;
}`;

      const expected = wrapExpected(`public class Player
{
    protected float health = 100;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile static property", () => {
      const input = `class GameManager extends Node {
  static instance: GameManager;
}`;

      const expected = wrapExpected(
        `public partial class GameManager : Node
{
    public static GameManager instance;
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile array property", () => {
      const input = `class Inventory {
  items: string[] = [];
}`;

      const expected = wrapExpected(
        `public class Inventory
{
    public List<string> items = new List<string>();
}`,
        ["System.Collections.Generic"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile nullable property with union", () => {
      const input = `class Player {
  target: Player | null;
}`;

      const expected = wrapExpected(`public class Player
{
    public Player? target;
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Class methods", () => {
    it("should transpile method with no parameters", () => {
      const input = `class Player extends Node2D {
  respawn(): void {
  }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public void respawn()
    {
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile method with parameters", () => {
      const input = `class Player extends Node2D {
  takeDamage(amount: number): void {
  }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public void takeDamage(float amount)
    {
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile method with return type", () => {
      const input = `class Player extends Node2D {
  health: number = 100;
  getHealth(): number {
    return this.health;
  }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public float health = 100;
    public float getHealth()
    {
        return this.health;
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile method with multiple parameters", () => {
      const input = `class Player extends Node2D {
  move(x: number, y: number): void {
  }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public void move(float x, float y)
    {
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile method with optional parameters", () => {
      const input = `class Player extends Node2D {
  heal(amount: number, source?: string): void {
  }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public void heal(float amount, string? source = null)
    {
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile method with default parameters", () => {
      const input = `class Player extends Node2D {
  heal(amount: number = 10): void {
  }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public void heal(float amount = 10)
    {
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });
  });

  describe("Constructors", () => {
    it("should transpile constructor with no parameters", () => {
      const input = `class Player extends Node2D {
  constructor() {
  }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public Player()
    {
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile constructor with parameters", () => {
      const input = `class Player extends Node2D {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public string name;
    public Player(string name)
    {
        this.name = name;
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile constructor with parameter properties", () => {
      const input = `class Player extends Node2D {
  constructor(public name: string, private health: number) {
  }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public string name;
    private float health;
    public Player(string name, float health)
    {
        this.name = name;
        this.health = health;
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });
  });

  describe("Access modifiers", () => {
    it("should transpile public modifier (default)", () => {
      const input = `class Player {
  health: number = 100;
}`;

      const expected = wrapExpected(`public class Player
{
    public float health = 100;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile private modifier", () => {
      const input = `class Player {
  private _health: number = 100;
}`;

      const expected = wrapExpected(`public class Player
{
    private float _health = 100;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile protected modifier", () => {
      const input = `class Player {
  protected health: number = 100;
}`;

      const expected = wrapExpected(`public class Player
{
    protected float health = 100;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile private method", () => {
      const input = `class Player {
  private calculateDamage(): number { return 0; }
}`;

      const expected = wrapExpected(`public class Player
{
    private float calculateDamage()
    {
        return 0;
    }
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Static members", () => {
    it("should transpile static property", () => {
      const input = `class GameManager extends Node {
  static instance: GameManager;
}`;

      const expected = wrapExpected(
        `public partial class GameManager : Node
{
    public static GameManager instance;
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile static method", () => {
      const input = `class MathUtils {
  static add(a: number, b: number): number {
    return a + b;
  }
}`;

      const expected = wrapExpected(`public class MathUtils
{
    public static float add(float a, float b)
    {
        return a + b;
    }
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Getters and Setters", () => {
    it("should transpile getter", () => {
      const input = `class Player {
  private _health: number = 100;
  get health(): number {
    return this._health;
  }
}`;

      const expected = wrapExpected(`public class Player
{
    private float _health = 100;
    public float health { get => _health; }
}`);

      expectCSharp(input, expected);
    });

    it("should transpile setter", () => {
      const input = `class Player {
  private _health: number = 100;
  set health(value: number) {
    this._health = value;
  }
}`;

      const expected = wrapExpected(`public class Player
{
    private float _health = 100;
    public float health { set => _health = value; }
}`);

      expectCSharp(input, expected);
    });

    it("should transpile getter and setter pair", () => {
      const input = `class Player {
  private _health: number = 100;
  get health(): number { return this._health; }
  set health(value: number) { this._health = value; }
}`;

      const expected = wrapExpected(`public class Player
{
    private float _health = 100;
    public float health
    {
        get => _health;
        set => _health = value;
    }
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Abstract classes", () => {
    it("should transpile abstract class with abstract method", () => {
      const input = `abstract class Entity extends Node2D {
  abstract update(): void;
}`;

      const expected = wrapExpected(
        `public abstract partial class Entity : Node2D
{
    public abstract void update();
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile class extending abstract class", () => {
      const input = `class Player extends Entity {
  update(): void {
  }
}`;

      const expected = wrapExpected(`public class Player : Entity
{
    public void update()
    {
    }
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Method naming convention", () => {
    it("should preserve camelCase method names", () => {
      const input = `class Player {
  takeDamage(amount: number): void { }
  getHealth(): number { return 0; }
}`;

      const expected = wrapExpected(`public class Player
{
    public void takeDamage(float amount)
    {
    }
    public float getHealth()
    {
        return 0;
    }
}`);

      expectCSharp(input, expected);
    });

    it("should convert Godot lifecycle methods to _PascalCase", () => {
      const input = `class Player extends Node2D {
  _ready(): void { }
  _process(delta: number): void { }
  _physics_process(delta: number): void { }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public void _Ready()
    {
    }
    public void _Process(float delta)
    {
    }
    public void _PhysicsProcess(float delta)
    {
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });
  });

  describe("Interface implementation", () => {
    it("should transpile class implementing single interface", () => {
      const input = `class Player implements IEntity {
  name: string;
}`;

      const expected = wrapExpected(`public class Player : IEntity
{
    public string name;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile class implementing multiple interfaces", () => {
      const input = `class Player implements IEntity, IDamageable {
  health: number;
}`;

      const expected = wrapExpected(`public class Player : IEntity, IDamageable
{
    public float health;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile class extending and implementing", () => {
      const input = `class Player extends Node2D implements IEntity {
  name: string;
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D, IEntity
{
    public string name;
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile class extending and implementing multiple interfaces", () => {
      const input = `class Player extends Node2D implements IEntity, IDamageable {
  health: number;
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D, IEntity, IDamageable
{
    public float health;
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should add I prefix to interfaces without it", () => {
      const input = `class Player implements Entity {
  name: string;
}`;

      const expected = wrapExpected(`public class Player : IEntity
{
    public string name;
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Decorators", () => {
    it("should transpile @Export decorator to [Export] attribute", () => {
      // Note: Using PascalCase @Export because 'export' is a TS reserved keyword
      const input = `class Player extends Node2D {
  @Export
  health: number = 100;
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    [Export]
    public float health = 100;
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile @Onready decorator (skipped - no C# equivalent)", () => {
      const input = `class Player extends Node2D {
  @Onready
  sprite: Sprite2D;
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    public Sprite2D sprite;
}`,
        ["Godot"]
      );

      // Note: @Onready typically generates GetNode calls in _Ready, but for now we just skip it
      expectCSharp(input, expected);
    });

    it("should transpile multiple decorators", () => {
      const input = `class Player extends Node2D {
  @Export
  @Rpc
  health: number = 100;
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    [Export]
    [Rpc]
    public float health = 100;
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile decorator with arguments", () => {
      const input = `class Player extends Node2D {
  @ExportRange(0, 100)
  health: number = 100;
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    [Export(PropertyHint.Range, "0,100")]
    public float health = 100;
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile method decorators", () => {
      const input = `class Player extends Node2D {
  @Rpc("any_peer", "call_local")
  syncHealth(): void { }
}`;

      const expected = wrapExpected(
        `public partial class Player : Node2D
{
    [Rpc(MultiplayerApi.RpcMode.AnyPeer, CallLocal = true)]
    public void syncHealth()
    {
    }
}`,
        ["Godot"]
      );

      expectCSharp(input, expected);
    });
  });

  describe("Generic classes", () => {
    it("should transpile class with single type parameter", () => {
      const input = `class Container<T> {
  value: T;
}`;

      const expected = wrapExpected(`public class Container<T>
{
    public T value;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile class with multiple type parameters", () => {
      const input = `class Pair<T, U> {
  first: T;
  second: U;
}`;

      const expected = wrapExpected(`public class Pair<T, U>
{
    public T first;
    public U second;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile class with type parameter constraint", () => {
      const input = `class NodeContainer<T extends Entity> {
  node: T;
}`;

      // Note: The constraint type Entity is not a Godot type, so no using Godot needed
      const expected = wrapExpected(`public class NodeContainer<T> where T : Entity
{
    public T node;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile class with multiple constraints", () => {
      const input = `class Container<T extends Entity, U extends Component> {
  node: T;
  resource: U;
}`;

      const expected = wrapExpected(`public class Container<T, U> where T : Entity where U : Component
{
    public T node;
    public U resource;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile generic method in class", () => {
      const input = `class Utils {
  getFirst<T>(items: T[]): T {
    return items[0];
  }
}`;

      const expected = wrapExpected(
        `public class Utils
{
    public T getFirst<T>(List<T> items)
    {
        return items[0];
    }
}`,
        ["System.Collections.Generic"]
      );

      expectCSharp(input, expected);
    });
  });

  describe("Rest parameters", () => {
    it("should transpile rest parameter to params array", () => {
      const input = `class Logger {
  log(...messages: string[]): void { }
}`;

      const expected = wrapExpected(
        `public class Logger
{
    public void log(params string[] messages)
    {
    }
}`,
        ["System.Collections.Generic"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile rest parameter with number type", () => {
      const input = `class Calculator {
  sum(...numbers: number[]): number { return 0; }
}`;

      const expected = wrapExpected(
        `public class Calculator
{
    public float sum(params float[] numbers)
    {
        return 0;
    }
}`,
        ["System.Collections.Generic"]
      );

      expectCSharp(input, expected);
    });

    it("should transpile rest parameter after regular parameters", () => {
      const input = `class Logger {
  log(prefix: string, ...messages: string[]): void { }
}`;

      const expected = wrapExpected(
        `public class Logger
{
    public void log(string prefix, params string[] messages)
    {
    }
}`,
        ["System.Collections.Generic"]
      );

      expectCSharp(input, expected);
    });
  });
});
