# ts2cs Feature Reference

A complete reference of all TypeScript to C# transpilations supported by ts2cs, organized by category. Each example includes the test name for easy lookup.

---

## Table of Contents

- [Primitive Types](#primitive-types)
- [Array Types](#array-types)
- [Union Types](#union-types)
- [Special Types](#special-types)
- [Type References](#type-references)
- [Tuple Types](#tuple-types)
- [Function Types](#function-types)
- [Classes](#classes)
  - [Properties](#class-properties)
  - [Methods](#class-methods)
  - [Constructors](#constructors)
  - [Access Modifiers](#access-modifiers)
  - [Static Members](#static-members)
  - [Getters and Setters](#getters-and-setters)
  - [Abstract Classes](#abstract-classes)
  - [Godot Inheritance](#godot-class-inheritance)
- [Enums](#enums)
- [Interfaces](#interfaces)
- [Discriminated Unions](#discriminated-unions)
- [Statements](#statements)
  - [Variable Declarations](#variable-declarations)
  - [Operators](#operators)
  - [Control Flow](#control-flow)
  - [Special Functions](#special-function-calls)
- [Async/Await](#asyncawait)
- [Collection Types](#collection-types)
- [Imports and Exports](#imports-and-exports)
- [Edge Cases](#edge-cases)
- [Empty Files](#empty-files)

---

## Primitive Types

### `string` type
**Test:** `should transpile string type`

| TypeScript | C# |
|------------|-----|
| `string` | `string` |

---

### `number` type (default: float)
**Test:** `should transpile number type to float by default`

| TypeScript | C# |
|------------|-----|
| `number` | `float` |

---

### `number` type (configured: double)
**Test:** `should transpile number type to double when configured`

| TypeScript | C# |
|------------|-----|
| `number` | `double` |

---

### `boolean` type
**Test:** `should transpile boolean type to bool`

| TypeScript | C# |
|------------|-----|
| `boolean` | `bool` |

---

### `undefined` type
**Test:** `should transpile undefined to null`

| TypeScript | C# |
|------------|-----|
| `undefined` | `null` |

---

### `null` type
**Test:** `should transpile null type`

| TypeScript | C# |
|------------|-----|
| `null` | `null` |

---

## Array Types

### List Transform (Default)

#### `string[]` to `List<string>`
**Test:** `should transpile string[] to List<string>`

| TypeScript | C# |
|------------|-----|
| `string[]` | `List<string>` |

---

#### `number[]` to `List<float>`
**Test:** `should transpile number[] to List<float> by default`

| TypeScript | C# |
|------------|-----|
| `number[]` | `List<float>` |

---

#### `Array<T>` generic syntax
**Test:** `should transpile Array<T> to List<T>`

| TypeScript | C# |
|------------|-----|
| `Array<string>` | `List<string>` |

---

#### Nested arrays
**Test:** `should transpile nested arrays to List<List<T>>`

| TypeScript | C# |
|------------|-----|
| `number[][]` | `List<List<float>>` |

---

### Native Array Transform

#### `string[]` (native)
**Test:** `should transpile string[] to string[]`

| TypeScript | C# |
|------------|-----|
| `string[]` | `string[]` |

---

#### `number[]` to `float[]`
**Test:** `should transpile number[] to float[]`

| TypeScript | C# |
|------------|-----|
| `number[]` | `float[]` |

---

#### `number[]` to `double[]`
**Test:** `should transpile number[] to double[] when configured`

| TypeScript | C# |
|------------|-----|
| `number[]` | `double[]` |

---

#### `Array<T>` to native `T[]`
**Test:** `should transpile Array<T> generic syntax to T[]`

| TypeScript | C# |
|------------|-----|
| `Array<string>` | `string[]` |

---

#### Nested arrays (native)
**Test:** `should transpile nested arrays to T[][]`

| TypeScript | C# |
|------------|-----|
| `number[][]` | `float[][]` |

---

#### `boolean[]`
**Test:** `should transpile boolean arrays`

| TypeScript | C# |
|------------|-----|
| `boolean[]` | `bool[]` |

---

## Union Types

### Mixed type union
**Test:** `should transpile string | number union to object`

| TypeScript | C# |
|------------|-----|
| `string \| number` | `object` |

---

### Nullable with `null`
**Test:** `should transpile nullable types with null union`

| TypeScript | C# |
|------------|-----|
| `string \| null` | `string?` |

---

### Nullable with `undefined`
**Test:** `should transpile undefined union as nullable`

| TypeScript | C# |
|------------|-----|
| `string \| undefined` | `string?` |

---

### `number | null`
**Test:** `should transpile number | null to float?`

| TypeScript | C# |
|------------|-----|
| `number \| null` | `float?` |

---

### `boolean | undefined`
**Test:** `should transpile boolean | undefined to bool?`

| TypeScript | C# |
|------------|-----|
| `boolean \| undefined` | `bool?` |

---

### Triple union with null
**Test:** `should handle triple union with null as nullable`

| TypeScript | C# |
|------------|-----|
| `string \| number \| null` | `object` |

---

## Special Types

### `any` type
**Test:** `should transpile any type to object`

| TypeScript | C# |
|------------|-----|
| `any` | `object` |

---

### `unknown` type
**Test:** `should transpile unknown type to object`

| TypeScript | C# |
|------------|-----|
| `unknown` | `object` |

---

### `void` type
**Test:** `should transpile void type`

| TypeScript | C# |
|------------|-----|
| `void` | `void` |

---

### `never` type
**Test:** `should transpile never type to void`

| TypeScript | C# |
|------------|-----|
| `never` | `void` |

---

### `object` type
**Test:** `should transpile object type`

| TypeScript | C# |
|------------|-----|
| `object` | `object` |

---

## Type References

### Custom type
**Test:** `should preserve custom type references`

| TypeScript | C# |
|------------|-----|
| `Vector2` | `Vector2` |

---

### Godot type
**Test:** `should preserve Godot type references`

| TypeScript | C# |
|------------|-----|
| `Node2D` | `Node2D` |

---

### User-defined class
**Test:** `should preserve user-defined class references`

| TypeScript | C# |
|------------|-----|
| `Player` | `Player` |

---

## Tuple Types

### Simple tuple
**Test:** `should transpile simple tuple`

| TypeScript | C# |
|------------|-----|
| `[string, number]` | `(string, float)` |

---

### Triple tuple
**Test:** `should transpile triple tuple`

| TypeScript | C# |
|------------|-----|
| `[string, number, boolean]` | `(string, float, bool)` |

---

## Function Types

### No params, void return → `Action`
**Test:** `should transpile function with no params returning void to Action`

| TypeScript | C# |
|------------|-----|
| `() => void` | `Action` |

---

### Params, void return → `Action<T>`
**Test:** `should transpile function with params returning void to Action<T>`

| TypeScript | C# |
|------------|-----|
| `(x: number) => void` | `Action<float>` |

---

### No params, value return → `Func<T>`
**Test:** `should transpile function returning value to Func<T>`

| TypeScript | C# |
|------------|-----|
| `() => string` | `Func<string>` |

---

### Params and return → `Func<T, R>`
**Test:** `should transpile function with params and return to Func<T, R>`

| TypeScript | C# |
|------------|-----|
| `(x: number) => string` | `Func<float, string>` |

---

### Multiple params
**Test:** `should transpile function with multiple params`

| TypeScript | C# |
|------------|-----|
| `(a: string, b: number) => boolean` | `Func<string, float, bool>` |

---

## Classes

### Class Properties

#### Typed property
**Test:** `should transpile class with typed property`

**TypeScript:**
```typescript
class Player extends Node2D {
  health: number;
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public float health;
}
```

---

#### Initialized property
**Test:** `should transpile class with initialized property`

**TypeScript:**
```typescript
class Player extends Node2D {
  health: number = 100;
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public float health = 100;
}
```

---

#### Multiple properties
**Test:** `should transpile class with multiple properties`

**TypeScript:**
```typescript
class Player extends Node2D {
  health: number = 100;
  name: string = "Player";
  isAlive: boolean = true;
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public float health = 100;
    public string name = "Player";
    public bool isAlive = true;
}
```

---

#### Readonly property
**Test:** `should transpile readonly property`

**TypeScript:**
```typescript
class Config {
  readonly maxPlayers: number = 4;
}
```

**C#:**
```csharp
public partial class Config
{
    public readonly float maxPlayers = 4;
}
```

---

#### Optional property
**Test:** `should transpile optional property`

**TypeScript:**
```typescript
class Player {
  nickname?: string;
}
```

**C#:**
```csharp
public partial class Player
{
    public string? nickname;
}
```

---

#### Private property
**Test:** `should transpile private property`

**TypeScript:**
```typescript
class Player {
  private _health: number = 100;
}
```

**C#:**
```csharp
public partial class Player
{
    private float _health = 100;
}
```

---

#### Protected property
**Test:** `should transpile protected property`

**TypeScript:**
```typescript
class Player {
  protected health: number = 100;
}
```

**C#:**
```csharp
public partial class Player
{
    protected float health = 100;
}
```

---

#### Static property
**Test:** `should transpile static property`

**TypeScript:**
```typescript
class GameManager extends Node {
  static instance: GameManager;
}
```

**C#:**
```csharp
public partial class GameManager : Node
{
    public static GameManager instance;
}
```

---

#### Array property
**Test:** `should transpile array property`

**TypeScript:**
```typescript
class Inventory {
  items: string[] = [];
}
```

**C#:**
```csharp
public partial class Inventory
{
    public List<string> items = new List<string>();
}
```

---

#### Nullable property with union
**Test:** `should transpile nullable property with union`

**TypeScript:**
```typescript
class Player {
  target: Player | null;
}
```

**C#:**
```csharp
public partial class Player
{
    public Player? target;
}
```

---

### Class Methods

#### Method with no parameters
**Test:** `should transpile method with no parameters`

**TypeScript:**
```typescript
class Player extends Node2D {
  respawn(): void {
  }
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public void respawn()
    {
    }
}
```

---

#### Method with parameters
**Test:** `should transpile method with parameters`

**TypeScript:**
```typescript
class Player extends Node2D {
  takeDamage(amount: number): void {
  }
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public void takeDamage(float amount)
    {
    }
}
```

---

#### Method with return type
**Test:** `should transpile method with return type`

**TypeScript:**
```typescript
class Player extends Node2D {
  health: number = 100;
  getHealth(): number {
    return this.health;
  }
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public float health = 100;
    public float getHealth()
    {
        return this.health;
    }
}
```

---

#### Method with multiple parameters
**Test:** `should transpile method with multiple parameters`

**TypeScript:**
```typescript
class Player extends Node2D {
  move(x: number, y: number): void {
  }
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public void move(float x, float y)
    {
    }
}
```

---

#### Method with optional parameters
**Test:** `should transpile method with optional parameters`

**TypeScript:**
```typescript
class Player extends Node2D {
  heal(amount: number, source?: string): void {
  }
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public void heal(float amount, string? source = null)
    {
    }
}
```

---

#### Method with default parameters
**Test:** `should transpile method with default parameters`

**TypeScript:**
```typescript
class Player extends Node2D {
  heal(amount: number = 10): void {
  }
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public void heal(float amount = 10)
    {
    }
}
```

---

#### Private method
**Test:** `should transpile private method`

**TypeScript:**
```typescript
class Player {
  private calculateDamage(): number { return 0; }
}
```

**C#:**
```csharp
public partial class Player
{
    private float calculateDamage()
    {
        return 0;
    }
}
```

---

#### Godot lifecycle methods
**Test:** `should convert Godot lifecycle methods to _PascalCase`

**TypeScript:**
```typescript
class Player extends Node2D {
  _ready(): void { }
  _process(delta: number): void { }
  _physics_process(delta: number): void { }
}
```

**C#:**
```csharp
public partial class Player : Node2D
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
}
```

---

### Constructors

#### Constructor with no parameters
**Test:** `should transpile constructor with no parameters`

**TypeScript:**
```typescript
class Player extends Node2D {
  constructor() {
  }
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public Player()
    {
    }
}
```

---

#### Constructor with parameters
**Test:** `should transpile constructor with parameters`

**TypeScript:**
```typescript
class Player extends Node2D {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public string name;
    public Player(string name)
    {
        this.name = name;
    }
}
```

---

#### Constructor with parameter properties
**Test:** `should transpile constructor with parameter properties`

**TypeScript:**
```typescript
class Player extends Node2D {
  constructor(public name: string, private health: number) {
  }
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public string name;
    private float health;
    public Player(string name, float health)
    {
        this.name = name;
        this.health = health;
    }
}
```

---

### Access Modifiers

#### Public modifier (default)
**Test:** `should transpile public modifier (default)`

| TypeScript | C# |
|------------|-----|
| (no modifier) | `public` |

---

#### Private modifier
**Test:** `should transpile private modifier`

| TypeScript | C# |
|------------|-----|
| `private` | `private` |

---

#### Protected modifier
**Test:** `should transpile protected modifier`

| TypeScript | C# |
|------------|-----|
| `protected` | `protected` |

---

### Static Members

#### Static property
**Test:** `should transpile static property`

**TypeScript:**
```typescript
class GameManager extends Node {
  static instance: GameManager;
}
```

**C#:**
```csharp
public partial class GameManager : Node
{
    public static GameManager instance;
}
```

---

#### Static method
**Test:** `should transpile static method`

**TypeScript:**
```typescript
class MathUtils {
  static add(a: number, b: number): number {
    return a + b;
  }
}
```

**C#:**
```csharp
public partial class MathUtils
{
    public static float add(float a, float b)
    {
        return a + b;
    }
}
```

---

### Getters and Setters

#### Getter only
**Test:** `should transpile getter`

**TypeScript:**
```typescript
class Player {
  private _health: number = 100;
  get health(): number {
    return this._health;
  }
}
```

**C#:**
```csharp
public partial class Player
{
    private float _health = 100;
    public float health { get => _health; }
}
```

---

#### Setter only
**Test:** `should transpile setter`

**TypeScript:**
```typescript
class Player {
  private _health: number = 100;
  set health(value: number) {
    this._health = value;
  }
}
```

**C#:**
```csharp
public partial class Player
{
    private float _health = 100;
    public float health { set => _health = value; }
}
```

---

#### Getter and setter pair
**Test:** `should transpile getter and setter pair`

**TypeScript:**
```typescript
class Player {
  private _health: number = 100;
  get health(): number { return this._health; }
  set health(value: number) { this._health = value; }
}
```

**C#:**
```csharp
public partial class Player
{
    private float _health = 100;
    public float health
    {
        get => _health;
        set => _health = value;
    }
}
```

---

### Abstract Classes

#### Abstract class with abstract method
**Test:** `should transpile abstract class with abstract method`

**TypeScript:**
```typescript
abstract class Entity extends Node2D {
  abstract update(): void;
}
```

**C#:**
```csharp
public abstract partial class Entity : Node2D
{
    public abstract void update();
}
```

---

#### Class extending abstract class
**Test:** `should transpile class extending abstract class`

**TypeScript:**
```typescript
class Player extends Entity {
  update(): void {
  }
}
```

**C#:**
```csharp
public partial class Player : Entity
{
    public void update()
    {
    }
}
```

---

### Godot Class Inheritance

#### Extending Node2D
**Test:** `should transpile class extending Node2D with using Godot`

**TypeScript:**
```typescript
class Player extends Node2D {
}
```

**C#:**
```csharp
using Godot;

public partial class Player : Node2D
{
}
```

---

#### Extending Node
**Test:** `should transpile class extending Node with using Godot`

**TypeScript:**
```typescript
class GameManager extends Node {
}
```

**C#:**
```csharp
using Godot;

public partial class GameManager : Node
{
}
```

---

#### Extending CharacterBody2D
**Test:** `should transpile class extending CharacterBody2D with using Godot`

**TypeScript:**
```typescript
class Enemy extends CharacterBody2D {
}
```

**C#:**
```csharp
using Godot;

public partial class Enemy : CharacterBody2D
{
}
```

---

#### Extending Control
**Test:** `should transpile class extending Control with using Godot`

**TypeScript:**
```typescript
class MainMenu extends Control {
}
```

**C#:**
```csharp
using Godot;

public partial class MainMenu : Control
{
}
```

---

#### Extending Resource
**Test:** `should transpile class extending Resource with using Godot`

**TypeScript:**
```typescript
class ItemData extends Resource {
}
```

**C#:**
```csharp
using Godot;

public partial class ItemData : Resource
{
}
```

---

#### Non-Godot base class
**Test:** `should transpile class extending custom base without using Godot`

**TypeScript:**
```typescript
class Enemy extends BaseEnemy {
}
```

**C#:**
```csharp
public partial class Enemy : BaseEnemy
{
}
```

---

#### Multiple classes (mixed inheritance)
**Test:** `should add using Godot if any class extends Godot type`

**TypeScript:**
```typescript
class Player extends Node2D {
}

class HelperClass extends BaseHelper {
}
```

**C#:**
```csharp
using Godot;

public partial class Player : Node2D
{
}

public partial class HelperClass : BaseHelper
{
}
```

---

## Enums

### Simple enum
**Test:** `should transpile simple enum`

**TypeScript:**
```typescript
enum Direction {
  Up,
  Down,
  Left,
  Right
}
```

**C#:**
```csharp
public enum Direction
{
    Up,
    Down,
    Left,
    Right
}
```

---

### Enum with explicit values
**Test:** `should transpile enum with explicit values`

**TypeScript:**
```typescript
enum Status {
  Pending = 0,
  Active = 1,
  Completed = 2
}
```

**C#:**
```csharp
public enum Status
{
    Pending = 0,
    Active = 1,
    Completed = 2
}
```

---

### Enum with mixed values
**Test:** `should transpile enum with mixed values`

**TypeScript:**
```typescript
enum Priority {
  Low,
  Medium = 5,
  High
}
```

**C#:**
```csharp
public enum Priority
{
    Low,
    Medium = 5,
    High
}
```

---

### String enum
**Test:** `should transpile string enum to static class`

**TypeScript:**
```typescript
enum Color {
  Red = "RED",
  Blue = "BLUE",
  Green = "GREEN"
}
```

**C#:**
```csharp
public static class Color
{
    public const string Red = "RED";
    public const string Blue = "BLUE";
    public const string Green = "GREEN";
}
```

---

### Const enum
**Test:** `should handle const enum as regular enum`

**TypeScript:**
```typescript
const enum Direction {
  Up,
  Down,
  Left,
  Right
}
```

**C#:**
```csharp
public enum Direction
{
    Up,
    Down,
    Left,
    Right
}
```

---

## Interfaces

### Interface with properties
**Test:** `should transpile interface with properties`

**TypeScript:**
```typescript
interface IPlayer {
  name: string;
  health: number;
}
```

**C#:**
```csharp
public interface IPlayer
{
    string name { get; set; }
    float health { get; set; }
}
```

---

### Auto-add I prefix
**Test:** `should add I prefix if missing`

**TypeScript:**
```typescript
interface Player {
  name: string;
}
```

**C#:**
```csharp
public interface IPlayer
{
    string name { get; set; }
}
```

---

### Interface with methods
**Test:** `should transpile interface with methods`

**TypeScript:**
```typescript
interface IEntity {
  getName(): string;
  setHealth(value: number): void;
}
```

**C#:**
```csharp
public interface IEntity
{
    string getName();
    void setHealth(float value);
}
```

---

### Interface with optional properties
**Test:** `should transpile interface with optional properties`

**TypeScript:**
```typescript
interface IConfig {
  name: string;
  debug?: boolean;
}
```

**C#:**
```csharp
public interface IConfig
{
    string name { get; set; }
    bool? debug { get; set; }
}
```

---

### Interface inheritance
**Test:** `should transpile interface extending another interface`

**TypeScript:**
```typescript
interface IPlayer extends IEntity {
  score: number;
}
```

**C#:**
```csharp
public interface IPlayer : IEntity
{
    float score { get; set; }
}
```

---

### Interface inheritance with auto I prefix
**Test:** `should transpile interface extending interface without I prefix`

**TypeScript:**
```typescript
interface Player extends Entity {
  score: number;
}
```

**C#:**
```csharp
public interface IPlayer : IEntity
{
    float score { get; set; }
}
```

---

### Generic interface
**Test:** `should transpile generic interface`

**TypeScript:**
```typescript
interface IRepository<T> {
  get(id: string): T;
  save(item: T): void;
}
```

**C#:**
```csharp
public interface IRepository<T>
{
    T get(string id);
    void save(T item);
}
```

---

## Discriminated Unions

### Simple shape union with `kind` discriminant
**Test:** `should transpile simple shape union with kind discriminant`

**TypeScript:**
```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number };
```

**C#:**
```csharp
public abstract partial class Shape
{
    public abstract string Kind { get; }
}

public partial class Circle : Shape
{
    public override string Kind => "circle";
    public float radius;
}

public partial class Square : Shape
{
    public override string Kind => "square";
    public float size;
}
```

---

### Union with `type` discriminant
**Test:** `should transpile union with type discriminant`

**TypeScript:**
```typescript
type Event =
  | { type: 'click'; x: number; y: number }
  | { type: 'keypress'; key: string };
```

**C#:**
```csharp
public abstract partial class Event
{
    public abstract string Type { get; }
}

public partial class Click : Event
{
    public override string Type => "click";
    public float x;
    public float y;
}

public partial class Keypress : Event
{
    public override string Type => "keypress";
    public string key;
}
```

---

### Union with `status` discriminant
**Test:** `should transpile union with status discriminant`

**TypeScript:**
```typescript
type Result =
  | { status: 'success'; data: string }
  | { status: 'error'; message: string };
```

**C#:**
```csharp
public abstract partial class Result
{
    public abstract string Status { get; }
}

public partial class Success : Result
{
    public override string Status => "success";
    public string data;
}

public partial class Error : Result
{
    public override string Status => "error";
    public string message;
}
```

---

### Union with multiple properties per variant
**Test:** `should transpile union with multiple properties per variant`

**TypeScript:**
```typescript
type Shape =
  | { kind: 'circle'; radius: number; centerX: number; centerY: number }
  | { kind: 'rectangle'; width: number; height: number; x: number; y: number };
```

**C#:**
```csharp
public abstract partial class Shape
{
    public abstract string Kind { get; }
}

public partial class Circle : Shape
{
    public override string Kind => "circle";
    public float radius;
    public float centerX;
    public float centerY;
}

public partial class Rectangle : Shape
{
    public override string Kind => "rectangle";
    public float width;
    public float height;
    public float x;
    public float y;
}
```

---

### Union with shared properties
**Test:** `should transpile union with shared properties`

**TypeScript:**
```typescript
type Shape =
  | { kind: 'circle'; name: string; radius: number }
  | { kind: 'square'; name: string; size: number };
```

**C#:**
```csharp
public abstract partial class Shape
{
    public abstract string Kind { get; }
    public string name;
}

public partial class Circle : Shape
{
    public override string Kind => "circle";
    public float radius;
}

public partial class Square : Shape
{
    public override string Kind => "square";
    public float size;
}
```

---

### Union with more than two variants
**Test:** `should transpile union with more than two variants`

**TypeScript:**
```typescript
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'triangle'; base: number; height: number }
  | { kind: 'rectangle'; width: number; height: number };
```

**C#:**
```csharp
public abstract partial class Shape
{
    public abstract string Kind { get; }
}

public partial class Circle : Shape
{
    public override string Kind => "circle";
    public float radius;
}

public partial class Square : Shape
{
    public override string Kind => "square";
    public float size;
}

public partial class Triangle : Shape
{
    public override string Kind => "triangle";
    public float base;
    public float height;
}

public partial class Rectangle : Shape
{
    public override string Kind => "rectangle";
    public float width;
    public float height;
}
```

---

### Number literal discriminant
**Test:** `should transpile number literal discriminant`

**TypeScript:**
```typescript
type Message =
  | { code: 1; payload: string }
  | { code: 2; error: string };
```

**C#:**
```csharp
public abstract partial class Message
{
    public abstract int Code { get; }
}

public partial class Code1 : Message
{
    public override int Code => 1;
    public string payload;
}

public partial class Code2 : Message
{
    public override int Code => 2;
    public string error;
}
```

---

### Boolean literal discriminant
**Test:** `should transpile boolean literal discriminant`

**TypeScript:**
```typescript
type Result =
  | { success: true; data: string }
  | { success: false; error: string };
```

**C#:**
```csharp
public abstract partial class Result
{
    public abstract bool Success { get; }
}

public partial class SuccessTrue : Result
{
    public override bool Success => true;
    public string data;
}

public partial class SuccessFalse : Result
{
    public override bool Success => false;
    public string error;
}
```

---

### PascalCase class names from discriminant values
**Test:** `should generate PascalCase class names from discriminant values`

**TypeScript:**
```typescript
type Event =
  | { kind: 'user-created'; userId: string }
  | { kind: 'HTTP_ERROR'; code: number };
```

**C#:**
```csharp
public abstract partial class Event
{
    public abstract string Kind { get; }
}

public partial class UserCreated : Event
{
    public override string Kind => "user-created";
    public string userId;
}

public partial class HttpError : Event
{
    public override string Kind => "HTTP_ERROR";
    public float code;
}
```

---

### Enum-based discriminant
**Test:** `should support enum-based discriminant`

**TypeScript:**
```typescript
enum ShapeKind { Circle, Square }
type Shape =
  | { kind: ShapeKind.Circle; radius: number }
  | { kind: ShapeKind.Square; size: number };
```

**C#:**
```csharp
public enum ShapeKind
{
    Circle,
    Square
}

public abstract partial class Shape
{
    public abstract ShapeKind Kind { get; }
}

public partial class Circle : Shape
{
    public override ShapeKind Kind => ShapeKind.Circle;
    public float radius;
}

public partial class Square : Shape
{
    public override ShapeKind Kind => ShapeKind.Square;
    public float size;
}
```

---

### Union with optional properties
**Test:** `should handle discriminated union with optional properties`

**TypeScript:**
```typescript
type Shape =
  | { kind: 'circle'; radius: number; color?: string }
  | { kind: 'square'; size: number; color?: string };
```

**C#:**
```csharp
public abstract partial class Shape
{
    public abstract string Kind { get; }
    public string? color;
}

public partial class Circle : Shape
{
    public override string Kind => "circle";
    public float radius;
}

public partial class Square : Shape
{
    public override string Kind => "square";
    public float size;
}
```

---

## Statements

### Variable Declarations

#### `let` with initializer
**Test:** `should transpile let with initializer`

**TypeScript:**
```typescript
class Counter {
  increment(): void {
    let x = 5;
  }
}
```

**C#:**
```csharp
public partial class Counter
{
    public void increment()
    {
        var x = 5;
    }
}
```

---

#### `const` with initializer
**Test:** `should transpile const with initializer`

**TypeScript:**
```typescript
class Counter {
  getValue(): number {
    const PI = 3.14;
    return PI;
  }
}
```

**C#:**
```csharp
public partial class Counter
{
    public float getValue()
    {
        var PI = 3.14;
        return PI;
    }
}
```

---

#### Typed variable without initializer
**Test:** `should transpile typed variable without initializer`

**TypeScript:**
```typescript
class Counter {
  process(): void {
    let count: number;
    count = 10;
  }
}
```

**C#:**
```csharp
public partial class Counter
{
    public void process()
    {
        float count;
        count = 10;
    }
}
```

---

### Operators

#### `===` to `==`
**Test:** `should transpile === to ==`

**TypeScript:**
```typescript
class Checker {
  isEqual(a: number, b: number): boolean {
    return a === b;
  }
}
```

**C#:**
```csharp
public partial class Checker
{
    public bool isEqual(float a, float b)
    {
        return a == b;
    }
}
```

---

#### `!==` to `!=`
**Test:** `should transpile !== to !=`

**TypeScript:**
```typescript
class Checker {
  isNotEqual(a: number, b: number): boolean {
    return a !== b;
  }
}
```

**C#:**
```csharp
public partial class Checker
{
    public bool isNotEqual(float a, float b)
    {
        return a != b;
    }
}
```

---

#### `**` to `Mathf.Pow`
**Test:** `should transpile ** to Mathf.Pow`

**TypeScript:**
```typescript
class MathUtils {
  power(base: number, exp: number): number {
    return base ** exp;
  }
}
```

**C#:**
```csharp
public partial class MathUtils
{
    public float power(float @base, float exp)
    {
        return Mathf.Pow(@base, exp);
    }
}
```

---

### Control Flow

#### Simple `if` statement
**Test:** `should transpile simple if statement`

**TypeScript:**
```typescript
class Guard {
  check(x: number): void {
    if (x > 0) {
      return;
    }
  }
}
```

**C#:**
```csharp
public partial class Guard
{
    public void check(float x)
    {
        if (x > 0)
        {
            return;
        }
    }
}
```

---

#### `if-else` statement
**Test:** `should transpile if-else statement`

**TypeScript:**
```typescript
class Guard {
  check(x: number): string {
    if (x > 0) {
      return "positive";
    } else {
      return "non-positive";
    }
  }
}
```

**C#:**
```csharp
public partial class Guard
{
    public string check(float x)
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
}
```

---

#### `for` loop
**Test:** `should transpile for loop`

**TypeScript:**
```typescript
class Counter {
  count(): void {
    for (let i = 0; i < 10; i++) {
      continue;
    }
  }
}
```

**C#:**
```csharp
public partial class Counter
{
    public void count()
    {
        for (var i = 0; i < 10; i++)
        {
            continue;
        }
    }
}
```

---

#### `for-of` to `foreach`
**Test:** `should transpile for-of to foreach`

**TypeScript:**
```typescript
class Iterator {
  process(items: string[]): void {
    for (const item of items) {
      break;
    }
  }
}
```

**C#:**
```csharp
public partial class Iterator
{
    public void process(List<string> items)
    {
        foreach (var item in items)
        {
            break;
        }
    }
}
```

---

#### `while` loop
**Test:** `should transpile while loop`

**TypeScript:**
```typescript
class Runner {
  run(): void {
    let running = true;
    while (running) {
      running = false;
    }
  }
}
```

**C#:**
```csharp
public partial class Runner
{
    public void run()
    {
        var running = true;
        while (running)
        {
            running = false;
        }
    }
}
```

---

### Special Function Calls

#### `console.log` to `GD.Print`
**Test:** `should transpile console.log to GD.Print`

**TypeScript:**
```typescript
class Logger {
  log(msg: string): void {
    console.log(msg);
  }
}
```

**C#:**
```csharp
public partial class Logger
{
    public void log(string msg)
    {
        GD.Print(msg);
    }
}
```

---

## Async/Await

### `Promise<string>` to `Task<string>`
**Test:** `should map Promise<string> to Task<string>`

| TypeScript | C# |
|------------|-----|
| `Promise<string>` | `Task<string>` |

---

### `Promise<number>` to `Task<float>`
**Test:** `should map Promise<number> to Task<float>`

| TypeScript | C# |
|------------|-----|
| `Promise<number>` | `Task<float>` |

---

### `Promise<void>` to `Task`
**Test:** `should map Promise<void> to Task`

| TypeScript | C# |
|------------|-----|
| `Promise<void>` | `Task` |

---

### Async method
**Test:** `should transpile async method`

**TypeScript:**
```typescript
class DataLoader {
  async loadData(): Promise<string> {
    return "data";
  }
}
```

**C#:**
```csharp
public partial class DataLoader
{
    public async Task<string> loadData()
    {
        return "data";
    }
}
```

---

### Async method with `Task` (void)
**Test:** `should transpile async method with Task (void)`

**TypeScript:**
```typescript
class DataLoader {
  async process(): Promise<void> {
  }
}
```

**C#:**
```csharp
public partial class DataLoader
{
    public async Task process()
    {
    }
}
```

---

## Collection Types

### `Map<K, V>` to `Dictionary<K, V>`
**Test:** `should map Map<string, number> to Dictionary<string, float>`

| TypeScript | C# |
|------------|-----|
| `Map<string, number>` | `Dictionary<string, float>` |

---

### `Set<T>` to `HashSet<T>`
**Test:** `should map Set<string> to HashSet<string>`

| TypeScript | C# |
|------------|-----|
| `Set<string>` | `HashSet<string>` |

---

### `Record<K, V>` to `Dictionary<K, V>`
**Test:** `should map Record<string, number> to Dictionary<string, float>`

| TypeScript | C# |
|------------|-----|
| `Record<string, number>` | `Dictionary<string, float>` |

---

### `ReadonlyArray<T>` to `IReadOnlyList<T>`
**Test:** `should map ReadonlyArray<string> to IReadOnlyList<string>`

| TypeScript | C# |
|------------|-----|
| `ReadonlyArray<string>` | `IReadOnlyList<string>` |

---

### `WeakMap` to `Dictionary`
**Test:** `should map WeakMap to Dictionary`

| TypeScript | C# |
|------------|-----|
| `WeakMap<object, string>` | `Dictionary<object, string>` |

---

### `WeakSet` to `HashSet`
**Test:** `should map WeakSet to HashSet`

| TypeScript | C# |
|------------|-----|
| `WeakSet<object>` | `HashSet<object>` |

---

## Imports and Exports

### Exported class
**Test:** `should transpile exported class (public by default)`

**TypeScript:**
```typescript
export class Player extends Node2D {
}
```

**C#:**
```csharp
using Godot;

public partial class Player : Node2D
{
}
```

---

### Default export class
**Test:** `should transpile default export class as regular class`

**TypeScript:**
```typescript
export default class Player extends Node2D {}
```

**C#:**
```csharp
using Godot;

public partial class Player : Node2D
{
}
```

---

### Godot types detection
**Test:** `should detect Godot types in extends clause and add using statement`

**TypeScript:**
```typescript
class Player extends Node2D {
}
```

**C#:**
```csharp
using Godot;

public partial class Player : Node2D
{
}
```

---

### Non-Godot class (no using)
**Test:** `should not add using Godot for non-Godot classes`

**TypeScript:**
```typescript
class Player extends BaseEntity {
}
```

**C#:**
```csharp
public partial class Player : BaseEntity
{
}
```

---

## Edge Cases

### C# Keyword Escaping

#### Parameter named `base`
**Test:** `should escape parameter named "base"`

**TypeScript:**
```typescript
class Player extends Node2D {
  takeDamage(base: number): void {
  }
}
```

**C#:**
```csharp
public partial class Player : Node2D
{
    public void takeDamage(float @base)
    {
    }
}
```

---

#### Parameter named `event`
**Test:** `should escape parameter named "event"`

**TypeScript:**
```typescript
class Entity {
  setType(event: string): void {
  }
}
```

**C#:**
```csharp
public partial class Entity
{
    public void setType(string @event)
    {
    }
}
```

---

#### Multiple keyword parameters
**Test:** `should escape multiple keyword parameters`

**TypeScript:**
```typescript
class Utils {
  process(event: string, base: number, object: boolean): void {
  }
}
```

**C#:**
```csharp
public partial class Utils
{
    public void process(string @event, float @base, bool @object)
    {
    }
}
```

---

#### Property named `event`
**Test:** `should escape property named "event"`

**TypeScript:**
```typescript
class Handler {
  event: string;
}
```

**C#:**
```csharp
public partial class Handler
{
    public string @event;
}
```

---

#### Property named `namespace`
**Test:** `should escape property named "namespace"`

**TypeScript:**
```typescript
class Config {
  namespace: string = "default";
}
```

**C#:**
```csharp
public partial class Config
{
    public string @namespace = "default";
}
```

---

### Empty Array Type Inference

#### Empty `string[]` with native array config
**Test:** `should generate typed empty array for string[] with native array config`

**TypeScript:**
```typescript
class Inventory {
  items: string[] = [];
}
```

**C#:**
```csharp
public partial class Inventory
{
    public string[] items = new string[] { };
}
```

---

#### Empty `number[]` with native array config
**Test:** `should generate typed empty array for number[] with native array config`

**TypeScript:**
```typescript
class Stats {
  scores: number[] = [];
}
```

**C#:**
```csharp
public partial class Stats
{
    public float[] scores = new float[] { };
}
```

---

#### Non-empty array literal with native array config
**Test:** `should handle non-empty array literals with native array config`

**TypeScript:**
```typescript
class Config {
  values: number[] = [1, 2, 3];
}
```

**C#:**
```csharp
public partial class Config
{
    public float[] values = new[] { 1, 2, 3 };
}
```

---

## Empty Files

### Empty TS file
**Test:** `should produce CS with only header comment for empty TS file`

**TypeScript:**
```typescript
// (empty)
```

**C#:**
```csharp
// <auto-generated>
//     This file was generated by ts2cs. Do not edit manually.
// </auto-generated>
```

---

### TS with only comments
**Test:** `should produce CS with only header for TS with only line comments`

**TypeScript:**
```typescript
// This is a comment
// Another comment
```

**C#:**
```csharp
// <auto-generated>
//     This file was generated by ts2cs. Do not edit manually.
// </auto-generated>
```

---

### TS with only whitespace
**Test:** `should produce CS with only header for TS with only whitespace`

**TypeScript:**
```typescript
   
    
  
```

**C#:**
```csharp
// <auto-generated>
//     This file was generated by ts2cs. Do not edit manually.
// </auto-generated>
```

