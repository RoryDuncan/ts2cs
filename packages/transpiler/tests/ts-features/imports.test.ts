import { describe, it, expect } from 'vitest';
import { expectCSharp, wrapExpected } from '../helpers.js';
import { analyzeImports } from '../../src/transformers/imports.js';
import { Project } from 'ts-morph';
import { parseConfig } from '../../src/config/schema.js';

/**
 * Tests for TypeScript import/export transpilation to C#
 * 
 * Reference: TypeScript Handbook - Modules
 * https://www.typescriptlang.org/docs/handbook/2/modules.html
 */

const defaultConfig = parseConfig({ inputDir: './src', outputDir: './out' });

describe('Import/Export Syntax', () => {
  describe('Named imports', () => {
    it('should transpile named import from godot to using statement', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import { Vector2 } from 'godot';
        class Player extends Node2D {}
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      expect(result.needsGodot).toBe(true);
    });

    it('should transpile multiple named imports from godot', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import { Vector2, Vector3, Transform2D } from 'godot';
        class Player extends Node2D {}
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      expect(result.needsGodot).toBe(true);
    });

    it('should transpile aliased import to using alias', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import { Vector2 as Vec2 } from 'godot';
        class Player extends Node2D {}
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      expect(result.needsGodot).toBe(true);
      expect(result.typeAliases.get('Vec2')).toBe('Godot.Vector2');
    });

    it('should not add using for relative import (inline qualification)', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import { Enemy } from './enemy';
        class Player {}
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      // Relative imports use inline qualification, no using statement
      expect(result.usings.size).toBe(0);
    });

    it('should handle relative import from parent directory', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import { BaseEntity } from '../entities/base';
        class Player extends BaseEntity {}
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      // Relative imports use inline qualification, no using statement
      expect(result.usings.size).toBe(0);
    });
  });

  describe('Default imports', () => {
    it('should warn about default import', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import Player from './player';
        class Game { player: Player; }
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      // Default imports warn because there's no direct C# equivalent
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('not supported');
    });

    it('should warn about default import with named imports', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import Player, { PlayerState } from './player';
        class Game { player: Player; }
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      // Default imports warn
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Namespace imports', () => {
    it('should transpile namespace import from godot', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import * as Godot from 'godot';
        class Player extends Node2D {}
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      expect(result.needsGodot).toBe(true);
    });

    it('should handle namespace import for local module', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import * as Utils from './utils';
        class Game { 
          helper: Utils.Helper;
        }
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      // Namespace imports from local modules use inline qualification
      expect(result.usings.size).toBe(0);
    });
  });

  describe('Side-effect imports', () => {
    it('should warn about side-effect only import', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import './polyfills';
        class Player {}
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Side-effect import');
    });
  });

  describe('Type-only imports', () => {
    it('should skip type-only import', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import type { PlayerState } from './player';
        class Player {}
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      // Type-only imports don't add usings
      expect(result.usings.size).toBe(0);
      expect(result.warnings.length).toBe(0);
    });

    it('should handle inline type import correctly', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import { type PlayerState, PlayerClass } from './player';
        class Game { 
          state: PlayerState;
          player: PlayerClass;
        }
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      // Inline type imports are part of named imports
      // and use inline qualification like other relative imports
      expect(result.usings.size).toBe(0);
    });
  });

  describe('Export statements', () => {
    it('should transpile exported class (public by default)', () => {
      const input = `export class Player extends Node2D {
}`;

      const expected = wrapExpected(`public partial class Player : Node2D
{
}`, ['Godot']);

      expectCSharp(input, expected);
    });

    it('should transpile renamed export as original class', () => {
      // Export renaming doesn't affect the C# output - we use the original class name
      const input = `class Player extends Node2D {}
export { Player as MainPlayer };`;

      const expected = wrapExpected(`public partial class Player : Node2D
{
}`, ['Godot']);

      expectCSharp(input, expected);
    });

    it('should transpile default export class as regular class', () => {
      // Default exports become regular classes in C#
      const input = `export default class Player extends Node2D {}`;

      const expected = wrapExpected(`public partial class Player : Node2D
{
}`, ['Godot']);

      expectCSharp(input, expected);
    });

    it('should skip re-export statements', () => {
      // Re-exports have no C# equivalent - types are resolved at import site
      const input = `export { Enemy } from './enemy';
class Game {}`;

      const expected = wrapExpected(`public partial class Game
{
}`);

      expectCSharp(input, expected);
    });
  });

  describe('Godot-specific imports', () => {
    it('should detect Godot types in extends clause and add using statement', () => {
      const input = `class Player extends Node2D {
}`;

      const expected = wrapExpected(`public partial class Player : Node2D
{
}`, ['Godot']);

      expectCSharp(input, expected);
    });

    it('should detect Sprite2D and add using Godot', () => {
      const input = `class Enemy extends Sprite2D {
}`;

      const expected = wrapExpected(`public partial class Enemy : Sprite2D
{
}`, ['Godot']);

      expectCSharp(input, expected);
    });

    it('should not add using Godot for non-Godot classes', () => {
      const input = `class Player extends BaseEntity {
}`;

      const expected = wrapExpected(`public partial class Player : BaseEntity
{
}`);

      expectCSharp(input, expected);
    });
  });

  describe('Module resolution', () => {
    it('should handle module resolution for type references', () => {
      // Module resolution happens at type usage, not at import analysis
      // The type transformer will use inline qualification for imported types
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import { Enemy } from './entities/enemy';
        class Player { 
          target: Enemy;
        }
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      // No usings added - inline qualification used at type usage
      expect(result.usings.size).toBe(0);
    });

    it('should handle index file imports same as regular imports', () => {
      // Directory imports (resolving to index.ts) work same as file imports
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', `
        import { Player, Enemy } from './entities';
        class Game { 
          player: Player;
          enemy: Enemy;
        }
      `);
      
      const result = analyzeImports(sourceFile, defaultConfig);
      
      // Relative imports use inline qualification
      expect(result.usings.size).toBe(0);
    });
  });
});
