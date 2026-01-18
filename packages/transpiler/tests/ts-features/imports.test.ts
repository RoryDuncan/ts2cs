import { describe, it, expect } from 'vitest';
import { expectCSharp, GENERATED_HEADER } from '../helpers.js';

/**
 * Tests for TypeScript import/export transpilation to C#
 * 
 * Reference: TypeScript Handbook - Modules
 * https://www.typescriptlang.org/docs/handbook/2/modules.html
 */

describe('Import/Export Syntax', () => {
  describe('Named imports', () => {
    it.todo('should transpile named import to using statement', () => {
      // import { Vector2 } from 'godot';
      // ->
      // using Godot; // Vector2 is part of Godot namespace
    });

    it.todo('should transpile multiple named imports', () => {
      // import { Vector2, Vector3, Transform2D } from 'godot';
      // ->
      // using Godot;
    });

    it.todo('should transpile aliased import', () => {
      // import { Vector2 as Vec2 } from 'godot';
      // ->
      // using Vec2 = Godot.Vector2;
    });

    it.todo('should transpile relative import from local file', () => {
      // import { Enemy } from './enemy';
      // ->
      // (depends on namespace strategy - might not need using)
    });

    it.todo('should transpile relative import from parent directory', () => {
      // import { BaseEntity } from '../entities/base';
    });
  });

  describe('Default imports', () => {
    it.todo('should transpile default import', () => {
      // import Player from './player';
      // ->
      // (needs decision on default export handling)
    });

    it.todo('should transpile default import with named imports', () => {
      // import Player, { PlayerState } from './player';
    });
  });

  describe('Namespace imports', () => {
    it.todo('should transpile namespace import', () => {
      // import * as Godot from 'godot';
      // ->
      // using Godot;
    });

    it.todo('should transpile namespace import for local module', () => {
      // import * as Utils from './utils';
      // ->
      // (needs decision on namespace generation)
    });
  });

  describe('Side-effect imports', () => {
    it.todo('should handle side-effect only import', () => {
      // import './polyfills';
      // ->
      // (no direct C# equivalent - might skip or warn)
    });
  });

  describe('Type-only imports', () => {
    it.todo('should transpile type-only import', () => {
      // import type { PlayerState } from './player';
      // ->
      // (no runtime import needed, just type reference)
    });

    it.todo('should transpile inline type import', () => {
      // import { type PlayerState, PlayerClass } from './player';
    });
  });

  describe('Export statements', () => {
    it('should transpile exported class (public by default)', () => {
      const input = `export class Player extends Node2D {
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
}`;

      expectCSharp(input, expected);
    });

    it.todo('should transpile renamed export', () => {
      // class Player extends Node2D {}
      // export { Player as MainPlayer };
      // ->
      // (needs decision - type alias? or just use original name?)
    });

    it.todo('should transpile default export class', () => {
      // export default class Player extends Node2D {}
    });

    it.todo('should transpile re-export', () => {
      // export { Enemy } from './enemy';
      // ->
      // (no direct equivalent - might generate wrapper or skip)
    });
  });

  describe('Godot-specific imports', () => {
    it('should detect Godot types in extends clause and add using statement', () => {
      const input = `class Player extends Node2D {
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Player : Node2D
{
}`;

      expectCSharp(input, expected);
    });

    it('should detect Sprite2D and add using Godot', () => {
      const input = `class Enemy extends Sprite2D {
}`;

      const expected = `${GENERATED_HEADER}

using Godot;

public partial class Enemy : Sprite2D
{
}`;

      expectCSharp(input, expected);
    });

    it('should not add using Godot for non-Godot classes', () => {
      const input = `class Player extends BaseEntity {
}`;

      const expected = `${GENERATED_HEADER}

public partial class Player : BaseEntity
{
}`;

      expectCSharp(input, expected);
    });
  });

  describe('Module resolution', () => {
    it.todo('should resolve relative paths to C# namespaces', () => {
      // ./entities/player -> Entities.Player namespace
      // ../common/utils -> Common.Utils namespace
    });

    it.todo('should handle index file imports', () => {
      // import { Player } from './entities';
      // ->
      // (resolves to ./entities/index.ts)
    });
  });
});

