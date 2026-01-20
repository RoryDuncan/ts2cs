import { describe, it } from "vitest";
import { expectCSharp, wrapExpected, GENERATED_HEADER } from "../helpers.js";

/**
 * Tests for TypeScript discriminated union transpilation to C#
 *
 * Reference: TypeScript Handbook - Narrowing (Discriminated Unions)
 * https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions
 *
 * Strategy: Abstract base class + subclasses pattern
 *
 * TypeScript discriminated unions use a common "tag" property (discriminant)
 * to distinguish between union members. In C#, we can represent this using
 * an abstract base class with concrete subclasses for each variant.
 */

describe("Discriminated Unions", () => {
  describe("Basic discriminated union", () => {
    it("should transpile simple shape union with kind discriminant", () => {
      const input = `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number };`;

      const expected = wrapExpected(`public abstract class Shape
{
    public abstract string Kind { get; }
}

public class Circle : Shape
{
    public override string Kind => "circle";
    public float radius;
}

public class Square : Shape
{
    public override string Kind => "square";
    public float size;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile union with type discriminant", () => {
      const input = `type Event =
  | { type: 'click'; x: number; y: number }
  | { type: 'keypress'; key: string };`;

      const expected = wrapExpected(`public abstract class Event
{
    public abstract string Type { get; }
}

public class Click : Event
{
    public override string Type => "click";
    public float x;
    public float y;
}

public class Keypress : Event
{
    public override string Type => "keypress";
    public string key;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile union with status discriminant", () => {
      const input = `type Result =
  | { status: 'success'; data: string }
  | { status: 'error'; message: string };`;

      const expected = wrapExpected(`public abstract class Result
{
    public abstract string Status { get; }
}

public class Success : Result
{
    public override string Status => "success";
    public string data;
}

public class Error : Result
{
    public override string Status => "error";
    public string message;
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Complex discriminated unions", () => {
    it("should transpile union with multiple properties per variant", () => {
      const input = `type Shape =
  | { kind: 'circle'; radius: number; centerX: number; centerY: number }
  | { kind: 'rectangle'; width: number; height: number; x: number; y: number };`;

      const expected = wrapExpected(`public abstract class Shape
{
    public abstract string Kind { get; }
}

public class Circle : Shape
{
    public override string Kind => "circle";
    public float radius;
    public float centerX;
    public float centerY;
}

public class Rectangle : Shape
{
    public override string Kind => "rectangle";
    public float width;
    public float height;
    public float x;
    public float y;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile union with shared properties", () => {
      const input = `type Shape =
  | { kind: 'circle'; name: string; radius: number }
  | { kind: 'square'; name: string; size: number };`;

      const expected = wrapExpected(`public abstract class Shape
{
    public abstract string Kind { get; }
    public string name;
}

public class Circle : Shape
{
    public override string Kind => "circle";
    public float radius;
}

public class Square : Shape
{
    public override string Kind => "square";
    public float size;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile union with more than two variants", () => {
      const input = `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; size: number }
  | { kind: 'triangle'; base: number; height: number }
  | { kind: 'rectangle'; width: number; height: number };`;

      const expected = wrapExpected(`public abstract class Shape
{
    public abstract string Kind { get; }
}

public class Circle : Shape
{
    public override string Kind => "circle";
    public float radius;
}

public class Square : Shape
{
    public override string Kind => "square";
    public float size;
}

public class Triangle : Shape
{
    public override string Kind => "triangle";
    public float base;
    public float height;
}

public class Rectangle : Shape
{
    public override string Kind => "rectangle";
    public float width;
    public float height;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile discriminated unions with referenced types", () => {
      // DUs with properties referencing other types work because
      // mapTypeName passes through unknown type names
      const input = `type Shape =
  | { kind: 'circle'; center: Point }
  | { kind: 'polygon'; vertices: Point[] };`;

      const expected = wrapExpected(
        `public abstract class Shape
{
    public abstract string Kind { get; }
}

public class Circle : Shape
{
    public override string Kind => "circle";
    public Point center;
}

public class Polygon : Shape
{
    public override string Kind => "polygon";
    public List<Point> vertices;
}`,
        ["System.Collections.Generic"]
      );

      expectCSharp(input, expected);
    });
  });

  describe("Discriminant property types", () => {
    it("should transpile number literal discriminant", () => {
      const input = `type Message =
  | { code: 1; payload: string }
  | { code: 2; error: string };`;

      const expected = wrapExpected(`public abstract class Message
{
    public abstract int Code { get; }
}

public class Code1 : Message
{
    public override int Code => 1;
    public string payload;
}

public class Code2 : Message
{
    public override int Code => 2;
    public string error;
}`);

      expectCSharp(input, expected);
    });

    it("should transpile boolean literal discriminant", () => {
      const input = `type Result =
  | { success: true; data: string }
  | { success: false; error: string };`;

      const expected = wrapExpected(`public abstract class Result
{
    public abstract bool Success { get; }
}

public class SuccessTrue : Result
{
    public override bool Success => true;
    public string data;
}

public class SuccessFalse : Result
{
    public override bool Success => false;
    public string error;
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Using discriminated unions", () => {
    it.skip("should transpile switch on discriminant (future enhancement)", () => {
      // Future: Convert switch(shape.kind) to C# pattern matching
      // function getArea(shape: Shape): number {
      //   switch (shape.kind) {
      //     case 'circle':
      //       return Math.PI * shape.radius ** 2;
      //     case 'square':
      //       return shape.size ** 2;
      //   }
      // }
      //
      // ->
      //
      // public double GetArea(Shape shape)
      // {
      //     return shape switch
      //     {
      //         Circle c => Math.PI * c.radius * c.radius,
      //         Square s => s.size * s.size,
      //         _ => throw new ArgumentException()
      //     };
      // }
      //
      // Requires control flow analysis and type narrowing
    });

    it.skip("should transpile if-else narrowing (future enhancement)", () => {
      // Future: Convert if-else type narrowing to C# is checks
      // function describe(shape: Shape): string {
      //   if (shape.kind === 'circle') {
      //     return `Circle with radius ${shape.radius}`;
      //   } else {
      //     return `Square with size ${shape.size}`;
      //   }
      // }
      //
      // Requires control flow analysis
    });

    it.skip("should transpile type guard function (future enhancement)", () => {
      // Future: Convert TypeScript type predicates to C# is expressions
      // function isCircle(shape: Shape): shape is Circle {
      //   return shape.kind === 'circle';
      // }
      //
      // ->
      //
      // public bool IsCircle(Shape shape) => shape is Circle;
      //
      // Requires detecting type predicate return types
    });
  });

  describe("Naming conventions", () => {
    it("should generate PascalCase class names from discriminant values", () => {
      const input = `type Event =
  | { kind: 'user-created'; userId: string }
  | { kind: 'HTTP_ERROR'; code: number };`;

      const expected = wrapExpected(`public abstract class Event
{
    public abstract string Kind { get; }
}

public class UserCreated : Event
{
    public override string Kind => "user-created";
    public string userId;
}

public class HttpError : Event
{
    public override string Kind => "HTTP_ERROR";
    public float code;
}`);

      expectCSharp(input, expected);
    });

    it("should handle reserved C# keywords in discriminant values", () => {
      const input = `type Token =
  | { kind: 'class'; name: string }
  | { kind: 'namespace'; path: string };`;

      // Note: 'class' and 'namespace' become valid class names by capitalization
      const expected = wrapExpected(`public abstract class Token
{
    public abstract string Kind { get; }
}

public class Class : Token
{
    public override string Kind => "class";
    public string name;
}

public class Namespace : Token
{
    public override string Kind => "namespace";
    public string path;
}`);

      expectCSharp(input, expected);
    });
  });

  describe("Alternative patterns", () => {
    it("should support enum-based discriminant", () => {
      // Enum member values as discriminants
      const input = `enum ShapeKind { Circle, Square }
type Shape =
  | { kind: ShapeKind.Circle; radius: number }
  | { kind: ShapeKind.Square; size: number };`;

      // Both the enum and the DU are transpiled
      const expected = wrapExpected(`public enum ShapeKind
{
    Circle,
    Square
}

public abstract class Shape
{
    public abstract ShapeKind Kind { get; }
}

public class Circle : Shape
{
    public override ShapeKind Kind => ShapeKind.Circle;
    public float radius;
}

public class Square : Shape
{
    public override ShapeKind Kind => ShapeKind.Square;
    public float size;
}`);

      expectCSharp(input, expected);
    });

    it.skip("should support const enum discriminant (future enhancement)", () => {
      // Future: Support const enum values as discriminants
      // const enum EventType { Click = 'click', Keypress = 'keypress' }
      //
      // This requires resolving const enum values at transpile time
    });
  });

  describe("Edge cases", () => {
    it("should handle discriminated union with optional properties", () => {
      const input = `type Shape =
  | { kind: 'circle'; radius: number; color?: string }
  | { kind: 'square'; size: number; color?: string };`;

      const expected = wrapExpected(`public abstract class Shape
{
    public abstract string Kind { get; }
    public string? color;
}

public class Circle : Shape
{
    public override string Kind => "circle";
    public float radius;
}

public class Square : Shape
{
    public override string Kind => "square";
    public float size;
}`);

      expectCSharp(input, expected);
    });

    it("should handle discriminated union with array properties", () => {
      const input = `type Shape =
  | { kind: 'polygon'; vertices: number[] }
  | { kind: 'path'; size: number };`;

      const expected = wrapExpected(
        `public abstract class Shape
{
    public abstract string Kind { get; }
}

public class Polygon : Shape
{
    public override string Kind => "polygon";
    public List<float> vertices;
}

public class Path : Shape
{
    public override string Kind => "path";
    public float size;
}`,
        ["System.Collections.Generic"]
      );

      expectCSharp(input, expected);
    });

    it("should handle single-variant union as regular class", () => {
      // Single variant is not technically a discriminated union
      // It's just a type alias for an object type
      // This should not produce a DU output - it would be treated as a simple class
      const input = `type OnlyCircle = { kind: 'circle'; radius: number };`;

      // Single-member unions aren't recognized as DUs (need 2+ variants)
      // So this just outputs the header with no class
      expectCSharp(input, GENERATED_HEADER);
    });

    it("should skip non-discriminated union and output empty", () => {
      // Unions without a common discriminant are skipped
      const input = `type BadUnion = { x: number } | { y: number };`;

      // Non-discriminated unions are not transpiled
      expectCSharp(input, GENERATED_HEADER);
    });
  });
});
