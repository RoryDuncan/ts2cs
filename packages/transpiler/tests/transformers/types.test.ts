import { describe, it, expect } from 'vitest';
import { parseConfig, safeParseConfig, TranspilerConfig } from '../../src/index.js';

describe('Config Schema', () => {
  describe('parseConfig', () => {
    it('should parse a valid minimal configuration', () => {
      const config = {
        inputDir: './src',
        outputDir: './csharp',
      };

      const result = parseConfig(config);

      expect(result.inputDir).toBe('./src');
      expect(result.outputDir).toBe('./csharp');
      expect(result.namespace).toBe('GameScripts');
      expect(result.watch).toBe(false);
      expect(result.filePerModule).toBe(true);
    });

    it('should parse a full configuration with all options', () => {
      const config: TranspilerConfig = {
        inputDir: './typescript',
        outputDir: './generated',
        namespace: 'MyGame.Scripts',
        typeMappings: {
          number: 'float',
          string: 'string',
          boolean: 'bool',
        },
        filePerModule: false,
        watch: true,
        discriminatedUnionStrategy: 'tagged-struct',
      };

      const result = parseConfig(config);

      expect(result.namespace).toBe('MyGame.Scripts');
      expect(result.typeMappings?.number).toBe('float');
      expect(result.watch).toBe(true);
      expect(result.discriminatedUnionStrategy).toBe('tagged-struct');
    });

    it('should throw on invalid configuration', () => {
      const invalidConfig = {
        inputDir: '', // Empty string should fail
        outputDir: './out',
      };

      expect(() => parseConfig(invalidConfig)).toThrow();
    });

    it('should throw when required fields are missing', () => {
      const invalidConfig = {
        namespace: 'Test',
      };

      expect(() => parseConfig(invalidConfig)).toThrow();
    });
  });

  describe('safeParseConfig', () => {
    it('should return success for valid config', () => {
      const config = {
        inputDir: './src',
        outputDir: './out',
      };

      const result = safeParseConfig(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.inputDir).toBe('./src');
      }
    });

    it('should return failure for invalid config', () => {
      const invalidConfig = {
        inputDir: 123, // Wrong type
        outputDir: './out',
      };

      const result = safeParseConfig(invalidConfig);

      expect(result.success).toBe(false);
    });
  });
});

describe('Type Mappings', () => {
  it('should use default type mappings when not provided', () => {
    const config = parseConfig({
      inputDir: './src',
      outputDir: './out',
    });

    // Default mappings should be applied
    expect(config.typeMappings).toBeUndefined();
  });

  it('should allow custom type mappings', () => {
    const config = parseConfig({
      inputDir: './src',
      outputDir: './out',
      typeMappings: {
        number: 'float', // Override default 'double'
        any: 'dynamic', // Custom mapping
      },
    });

    expect(config.typeMappings?.number).toBe('float');
    expect(config.typeMappings?.any).toBe('dynamic');
  });
});

describe('Discriminated Union Strategy', () => {
  it('should default to abstract-subclass strategy', () => {
    const config = parseConfig({
      inputDir: './src',
      outputDir: './out',
    });

    expect(config.discriminatedUnionStrategy).toBe('abstract-subclass');
  });

  it('should accept tagged-struct strategy', () => {
    const config = parseConfig({
      inputDir: './src',
      outputDir: './out',
      discriminatedUnionStrategy: 'tagged-struct',
    });

    expect(config.discriminatedUnionStrategy).toBe('tagged-struct');
  });

  it('should reject invalid strategy values', () => {
    const invalidConfig = {
      inputDir: './src',
      outputDir: './out',
      discriminatedUnionStrategy: 'invalid-strategy',
    };

    expect(() => parseConfig(invalidConfig)).toThrow();
  });
});

