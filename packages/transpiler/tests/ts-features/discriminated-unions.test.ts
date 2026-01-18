import { describe, it, expect } from 'vitest';
import { expectCSharp, GENERATED_HEADER } from '../helpers.js';

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

describe('Discriminated Unions', () => {
  describe('Basic discriminated union', () => {
    it.todo('should transpile simple shape union with kind discriminant', () => {
      // type Shape =
      //   | { kind: 'circle'; radius: number }
      //   | { kind: 'square'; size: number };
      //
      // ->
      //
      // public abstract partial class Shape
      // {
      //     public abstract string Kind { get; }
      // }
      //
      // public partial class Circle : Shape
      // {
      //     public override string Kind => "circle";
      //     public double radius;
      // }
      //
      // public partial class Square : Shape
      // {
      //     public override string Kind => "square";
      //     public double size;
      // }
    });

    it.todo('should transpile union with type discriminant', () => {
      // type Event =
      //   | { type: 'click'; x: number; y: number }
      //   | { type: 'keypress'; key: string };
    });

    it.todo('should transpile union with status discriminant', () => {
      // type Result =
      //   | { status: 'success'; data: string }
      //   | { status: 'error'; message: string };
    });
  });

  describe('Complex discriminated unions', () => {
    it.todo('should transpile union with multiple properties per variant', () => {
      // type Shape =
      //   | { kind: 'circle'; radius: number; centerX: number; centerY: number }
      //   | { kind: 'rectangle'; width: number; height: number; x: number; y: number };
    });

    it.todo('should transpile union with shared properties', () => {
      // type Shape =
      //   | { kind: 'circle'; name: string; radius: number }
      //   | { kind: 'square'; name: string; size: number };
      //
      // ->
      // public abstract partial class Shape
      // {
      //     public abstract string Kind { get; }
      //     public string name; // Shared property in base class
      // }
    });

    it.todo('should transpile union with more than two variants', () => {
      // type Shape =
      //   | { kind: 'circle'; radius: number }
      //   | { kind: 'square'; size: number }
      //   | { kind: 'triangle'; base: number; height: number }
      //   | { kind: 'rectangle'; width: number; height: number };
    });

    it.todo('should transpile nested discriminated unions', () => {
      // type Shape =
      //   | { kind: 'circle'; radius: number }
      //   | { kind: 'polygon'; vertices: Point[] };
      //
      // type Point = { x: number; y: number };
    });
  });

  describe('Discriminant property types', () => {
    it.todo('should transpile string literal discriminant', () => {
      // { kind: 'circle' } -> Kind => "circle"
    });

    it.todo('should transpile number literal discriminant', () => {
      // type Message =
      //   | { code: 1; payload: string }
      //   | { code: 2; error: string };
      //
      // -> abstract int Code { get; }
    });

    it.todo('should transpile boolean literal discriminant', () => {
      // type Result =
      //   | { success: true; data: string }
      //   | { success: false; error: string };
      //
      // -> abstract bool Success { get; }
    });
  });

  describe('Using discriminated unions', () => {
    it.todo('should transpile switch on discriminant', () => {
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
    });

    it.todo('should transpile if-else narrowing', () => {
      // function describe(shape: Shape): string {
      //   if (shape.kind === 'circle') {
      //     return `Circle with radius ${shape.radius}`;
      //   } else {
      //     return `Square with size ${shape.size}`;
      //   }
      // }
    });

    it.todo('should transpile type guard function', () => {
      // function isCircle(shape: Shape): shape is Circle {
      //   return shape.kind === 'circle';
      // }
      //
      // ->
      //
      // public bool IsCircle(Shape shape) => shape is Circle;
    });
  });

  describe('Naming conventions', () => {
    it.todo('should generate PascalCase class names from discriminant values', () => {
      // 'circle' -> Circle
      // 'user-created' -> UserCreated
      // 'HTTP_ERROR' -> HttpError
    });

    it.todo('should handle reserved C# keywords in discriminant values', () => {
      // 'class' -> ClassVariant or similar
      // 'namespace' -> NamespaceVariant
    });
  });

  describe('Alternative patterns', () => {
    it.todo('should support enum-based discriminant (future)', () => {
      // enum ShapeKind { Circle, Square }
      // type Shape =
      //   | { kind: ShapeKind.Circle; radius: number }
      //   | { kind: ShapeKind.Square; size: number };
    });

    it.todo('should support const enum discriminant (future)', () => {
      // const enum EventType { Click = 'click', Keypress = 'keypress' }
    });
  });

  describe('Edge cases', () => {
    it.todo('should handle discriminated union with optional properties', () => {
      // type Shape =
      //   | { kind: 'circle'; radius: number; color?: string }
      //   | { kind: 'square'; size: number; color?: string };
    });

    it.todo('should handle discriminated union with array properties', () => {
      // type Shape =
      //   | { kind: 'polygon'; vertices: number[] }
      //   | { kind: 'path'; points: { x: number; y: number }[] };
    });

    it.todo('should handle single-variant union (degenerate case)', () => {
      // type OnlyCircle = { kind: 'circle'; radius: number };
      // -> Just a regular class, no base class needed
    });

    it.todo('should detect missing discriminant and warn', () => {
      // type BadUnion = { x: number } | { y: number };
      // -> Warning: No common discriminant property found
    });
  });
});

