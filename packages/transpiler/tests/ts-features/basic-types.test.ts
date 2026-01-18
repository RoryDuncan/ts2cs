import { describe, it, expect } from 'vitest';
import { Project, SyntaxKind } from 'ts-morph';
import { transformType } from '../../src/transformers/types.js';
import { getTypeMappings, parseConfig } from '../../src/config/schema.js';

/**
 * Tests for basic TypeScript type transpilation to C#
 * 
 * Reference: TypeScript Handbook - Everyday Types
 * https://www.typescriptlang.org/docs/handbook/2/everyday-types.html
 */

// Helper to get type mappings with default config
function getDefaultMappings() {
  const config = parseConfig({ inputDir: './src', outputDir: './out' });
  return getTypeMappings(config);
}

// Helper to get type mappings with double for numbers
function getDoubleMappings() {
  const config = parseConfig({ inputDir: './src', outputDir: './out', numberType: 'double' });
  return getTypeMappings(config);
}

// Helper to get type mappings with native array transform
function getArrayMappings() {
  const config = parseConfig({ inputDir: './src', outputDir: './out', arrayTransform: 'array' });
  return getTypeMappings(config);
}

// Helper to get type mappings with double and native arrays
function getDoubleArrayMappings() {
  const config = parseConfig({ inputDir: './src', outputDir: './out', numberType: 'double', arrayTransform: 'array' });
  return getTypeMappings(config);
}

// Helper to parse a type annotation and transform it
function parseAndTransformType(typeAnnotation: string, mappings = getDefaultMappings()): string {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.ts', `let x: ${typeAnnotation};`);
  const varDecl = sourceFile.getVariableDeclarations()[0];
  const typeNode = varDecl?.getTypeNode();
  return transformType(typeNode, mappings);
}

describe('Basic Types', () => {
  describe('Primitive types', () => {
    it('should transpile string type', () => {
      const result = parseAndTransformType('string');
      expect(result).toBe('string');
    });

    it('should transpile number type to float by default', () => {
      const result = parseAndTransformType('number');
      expect(result).toBe('float');
    });

    it('should transpile number type to double when configured', () => {
      const result = parseAndTransformType('number', getDoubleMappings());
      expect(result).toBe('double');
    });

    it('should transpile boolean type to bool', () => {
      const result = parseAndTransformType('boolean');
      expect(result).toBe('bool');
    });

    it('should transpile undefined to null', () => {
      const result = parseAndTransformType('undefined');
      expect(result).toBe('null');
    });

    it('should transpile null type', () => {
      const result = parseAndTransformType('null');
      expect(result).toBe('null');
    });
  });

  describe('Array types', () => {
    describe('with list transform (default)', () => {
      it('should transpile string[] to List<string>', () => {
        const result = parseAndTransformType('string[]');
        expect(result).toBe('List<string>');
      });

      it('should transpile number[] to List<float> by default', () => {
        const result = parseAndTransformType('number[]');
        expect(result).toBe('List<float>');
      });

      it('should transpile Array<T> to List<T>', () => {
        const result = parseAndTransformType('Array<string>');
        expect(result).toBe('List<string>');
      });

      it('should transpile nested arrays to List<List<T>>', () => {
        const result = parseAndTransformType('number[][]');
        expect(result).toBe('List<List<float>>');
      });
    });

    describe('with native array transform', () => {
      it('should transpile string[] to string[]', () => {
        const result = parseAndTransformType('string[]', getArrayMappings());
        expect(result).toBe('string[]');
      });

      it('should transpile number[] to float[]', () => {
        const result = parseAndTransformType('number[]', getArrayMappings());
        expect(result).toBe('float[]');
      });

      it('should transpile number[] to double[] when configured', () => {
        const result = parseAndTransformType('number[]', getDoubleArrayMappings());
        expect(result).toBe('double[]');
      });

      it('should transpile Array<T> generic syntax to T[]', () => {
        const result = parseAndTransformType('Array<string>', getArrayMappings());
        expect(result).toBe('string[]');
      });

      it('should transpile Array<number> to float[]', () => {
        const result = parseAndTransformType('Array<number>', getArrayMappings());
        expect(result).toBe('float[]');
      });

      it('should transpile nested arrays to T[][]', () => {
        const result = parseAndTransformType('number[][]', getArrayMappings());
        expect(result).toBe('float[][]');
      });

      it('should transpile boolean arrays', () => {
        const result = parseAndTransformType('boolean[]', getArrayMappings());
        expect(result).toBe('bool[]');
      });
    });
  });

  describe('Union types (simple)', () => {
    it('should transpile string | number union to object', () => {
      const result = parseAndTransformType('string | number');
      expect(result).toBe('object');
    });

    it('should transpile nullable types with null union', () => {
      const result = parseAndTransformType('string | null');
      expect(result).toBe('string?');
    });

    it('should transpile undefined union as nullable', () => {
      const result = parseAndTransformType('string | undefined');
      expect(result).toBe('string?');
    });

    it('should transpile number | null to float?', () => {
      const result = parseAndTransformType('number | null');
      expect(result).toBe('float?');
    });

    it('should transpile boolean | undefined to bool?', () => {
      const result = parseAndTransformType('boolean | undefined');
      expect(result).toBe('bool?');
    });

    it('should handle triple union with null as nullable', () => {
      // string | number | null -> object (complex union)
      const result = parseAndTransformType('string | number | null');
      expect(result).toBe('object');
    });
  });

  describe('Special types', () => {
    it('should transpile any type to object', () => {
      const result = parseAndTransformType('any');
      expect(result).toBe('object');
    });

    it('should transpile unknown type to object', () => {
      const result = parseAndTransformType('unknown');
      expect(result).toBe('object');
    });

    it('should transpile void type', () => {
      const result = parseAndTransformType('void');
      expect(result).toBe('void');
    });

    it('should transpile never type to void', () => {
      const result = parseAndTransformType('never');
      expect(result).toBe('void');
    });

    it('should transpile object type', () => {
      const result = parseAndTransformType('object');
      expect(result).toBe('object');
    });
  });

  describe('Type references', () => {
    it('should preserve custom type references', () => {
      const result = parseAndTransformType('Vector2');
      expect(result).toBe('Vector2');
    });

    it('should preserve Godot type references', () => {
      const result = parseAndTransformType('Node2D');
      expect(result).toBe('Node2D');
    });

    it('should preserve user-defined class references', () => {
      const result = parseAndTransformType('Player');
      expect(result).toBe('Player');
    });
  });

  describe('Tuple types', () => {
    it('should transpile simple tuple', () => {
      const result = parseAndTransformType('[string, number]');
      expect(result).toBe('(string, float)');
    });

    it('should transpile triple tuple', () => {
      const result = parseAndTransformType('[string, number, boolean]');
      expect(result).toBe('(string, float, bool)');
    });
  });

  describe('Function types', () => {
    it('should transpile function with no params returning void to Action', () => {
      const result = parseAndTransformType('() => void');
      expect(result).toBe('Action');
    });

    it('should transpile function with params returning void to Action<T>', () => {
      const result = parseAndTransformType('(x: number) => void');
      expect(result).toBe('Action<float>');
    });

    it('should transpile function returning value to Func<T>', () => {
      const result = parseAndTransformType('() => string');
      expect(result).toBe('Func<string>');
    });

    it('should transpile function with params and return to Func<T, R>', () => {
      const result = parseAndTransformType('(x: number) => string');
      expect(result).toBe('Func<float, string>');
    });

    it('should transpile function with multiple params', () => {
      const result = parseAndTransformType('(a: string, b: number) => boolean');
      expect(result).toBe('Func<string, float, bool>');
    });
  });
});
