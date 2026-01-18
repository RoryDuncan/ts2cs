import { describe, it, expect } from 'vitest';
import { expectCSharp, GENERATED_HEADER } from '../helpers.js';

/**
 * Tests for TypeScript class feature transpilation to C#
 * 
 * Reference: TypeScript Handbook - Classes
 * https://www.typescriptlang.org/docs/handbook/2/classes.html
 */

describe('Class Features', () => {
  describe('Class properties', () => {
    it('should transpile class with typed property', () => {
      const input = `class Player extends Node2D {
  health: number;
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
    public float health;
}`;

      expectCSharp(input, expected);
    });

    it('should transpile class with initialized property', () => {
      const input = `class Player extends Node2D {
  health: number = 100;
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
    public float health = 100;
}`;

      expectCSharp(input, expected);
    });

    it('should transpile class with multiple properties', () => {
      const input = `class Player extends Node2D {
  health: number = 100;
  name: string = "Player";
  isAlive: boolean = true;
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
    public float health = 100;
    public string name = "Player";
    public bool isAlive = true;
}`;

      expectCSharp(input, expected);
    });

    it('should transpile readonly property', () => {
      const input = `class Config {
  readonly maxPlayers: number = 4;
}`;

      const expected = `${GENERATED_HEADER}

public partial class Config
{
    public readonly float maxPlayers = 4;
}`;

      expectCSharp(input, expected);
    });

    it('should transpile optional property', () => {
      const input = `class Player {
  nickname?: string;
}`;

      const expected = `${GENERATED_HEADER}

public partial class Player
{
    public string? nickname;
}`;

      expectCSharp(input, expected);
    });

    it('should transpile private property', () => {
      const input = `class Player {
  private _health: number = 100;
}`;

      const expected = `${GENERATED_HEADER}

public partial class Player
{
    private float _health = 100;
}`;

      expectCSharp(input, expected);
    });

    it('should transpile protected property', () => {
      const input = `class Player {
  protected health: number = 100;
}`;

      const expected = `${GENERATED_HEADER}

public partial class Player
{
    protected float health = 100;
}`;

      expectCSharp(input, expected);
    });

    it('should transpile static property', () => {
      const input = `class GameManager extends Node {
  static instance: GameManager;
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class GameManager : Node
{
    public static GameManager instance;
}`;

      expectCSharp(input, expected);
    });

    it('should transpile array property', () => {
      const input = `class Inventory {
  items: string[] = [];
}`;

      const expected = `${GENERATED_HEADER}

public partial class Inventory
{
    public string[] items = new[] { };
}`;

      expectCSharp(input, expected);
    });

    it('should transpile nullable property with union', () => {
      const input = `class Player {
  target: Player | null;
}`;

      const expected = `${GENERATED_HEADER}

public partial class Player
{
    public Player? target;
}`;

      expectCSharp(input, expected);
    });
  });

  describe('Class methods', () => {
    it('should transpile method with no parameters', () => {
      const input = `class Player extends Node2D {
  respawn(): void {
  }
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
    public void Respawn()
    {
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile method with parameters', () => {
      const input = `class Player extends Node2D {
  takeDamage(amount: number): void {
  }
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
    public void TakeDamage(float amount)
    {
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile method with return type', () => {
      const input = `class Player extends Node2D {
  health: number = 100;
  getHealth(): number {
    return this.health;
  }
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
    public float health = 100;
    public float GetHealth()
    {
        return this.health;
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile method with multiple parameters', () => {
      const input = `class Player extends Node2D {
  move(x: number, y: number): void {
  }
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
    public void Move(float x, float y)
    {
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile method with optional parameters', () => {
      const input = `class Player extends Node2D {
  heal(amount: number, source?: string): void {
  }
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
    public void Heal(float amount, string? source = null)
    {
    }
}`;

      expectCSharp(input, expected);
    });

    it('should transpile method with default parameters', () => {
      const input = `class Player extends Node2D {
  heal(amount: number = 10): void {
  }
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
    public void Heal(float amount = 10)
    {
    }
}`;

      expectCSharp(input, expected);
    });
  });

  describe('Constructors', () => {
    it.todo('should transpile constructor with no parameters', () => {
      // class Player extends Node2D {
      //   constructor() {
      //   }
      // }
    });

    it.todo('should transpile constructor with parameters', () => {
      // class Player extends Node2D {
      //   name: string;
      //   constructor(name: string) {
      //     this.name = name;
      //   }
      // }
    });

    it.todo('should transpile constructor with parameter properties', () => {
      // class Player extends Node2D {
      //   constructor(public name: string, private health: number) {
      //   }
      // }
      // ->
      // public partial class Player : Node2D
      // {
      //     public string name;
      //     private float health;
      //     public Player(string name, float health) {
      //         this.name = name;
      //         this.health = health;
      //     }
      // }
    });
  });

  describe('Access modifiers', () => {
    it('should transpile public modifier (default)', () => {
      const input = `class Player {
  health: number = 100;
}`;

      const expected = `${GENERATED_HEADER}

public partial class Player
{
    public float health = 100;
}`;

      expectCSharp(input, expected);
    });

    it('should transpile private modifier', () => {
      const input = `class Player {
  private _health: number = 100;
}`;

      const expected = `${GENERATED_HEADER}

public partial class Player
{
    private float _health = 100;
}`;

      expectCSharp(input, expected);
    });

    it('should transpile protected modifier', () => {
      const input = `class Player {
  protected health: number = 100;
}`;

      const expected = `${GENERATED_HEADER}

public partial class Player
{
    protected float health = 100;
}`;

      expectCSharp(input, expected);
    });

    it.todo('should transpile private method', () => {
      // class Player {
      //   private calculateDamage(): number { return 0; }
      // }
    });
  });

  describe('Static members', () => {
    it('should transpile static property', () => {
      const input = `class GameManager extends Node {
  static instance: GameManager;
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class GameManager : Node
{
    public static GameManager instance;
}`;

      expectCSharp(input, expected);
    });

    it.todo('should transpile static method', () => {
      // class MathUtils {
      //   static clamp(value: number, min: number, max: number): number {
      //     return Math.max(min, Math.min(max, value));
      //   }
      // }
    });
  });

  describe('Getters and Setters', () => {
    it.todo('should transpile getter', () => {
      // class Player {
      //   private _health: number = 100;
      //   get health(): number {
      //     return this._health;
      //   }
      // }
      // ->
      // private float _health = 100;
      // public float health { get => _health; }
    });

    it.todo('should transpile setter', () => {
      // class Player {
      //   private _health: number = 100;
      //   set health(value: number) {
      //     this._health = value;
      //   }
      // }
      // ->
      // public float health { set => _health = value; }
    });

    it.todo('should transpile getter and setter pair', () => {
      // class Player {
      //   private _health: number = 100;
      //   get health(): number { return this._health; }
      //   set health(value: number) { this._health = value; }
      // }
      // ->
      // public float health {
      //     get => _health;
      //     set => _health = value;
      // }
    });
  });

  describe('Abstract classes', () => {
    it.todo('should transpile abstract class', () => {
      // abstract class Entity extends Node2D {
      //   abstract update(): void;
      // }
      // ->
      // public abstract partial class Entity : Node2D
      // {
      //     public abstract void Update();
      // }
    });

    it.todo('should transpile class extending abstract class', () => {
      // class Player extends Entity {
      //   update(): void {
      //   }
      // }
    });
  });

  describe('Method naming convention', () => {
    it.todo('should convert camelCase methods to PascalCase', () => {
      // takeDamage -> TakeDamage
      // getHealth -> GetHealth
      // _ready -> _Ready (Godot lifecycle)
    });

    it.todo('should preserve Godot lifecycle method names', () => {
      // _ready -> _Ready
      // _process -> _Process
      // _physics_process -> _PhysicsProcess
    });
  });
});
