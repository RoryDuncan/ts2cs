import * as v from 'valibot';

/**
 * Type mappings from TypeScript types to C# types
 */
export const TypeMappingsSchema = v.object({
  string: v.optional(v.string(), 'string'),
  number: v.optional(v.string(), 'double'),
  boolean: v.optional(v.string(), 'bool'),
  any: v.optional(v.string(), 'object'),
  void: v.optional(v.string(), 'void'),
  null: v.optional(v.string(), 'null'),
  undefined: v.optional(v.string(), 'null'),
});

/**
 * Main transpiler configuration schema
 */
export const TranspilerConfigSchema = v.object({
  /** Input directory containing TypeScript source files */
  inputDir: v.pipe(v.string(), v.minLength(1)),
  
  /** Output directory for generated C# files */
  outputDir: v.pipe(v.string(), v.minLength(1)),
  
  /** Base C# namespace for generated code */
  namespace: v.optional(v.string(), 'GameScripts'),
  
  /** Custom type mappings from TS to C# */
  typeMappings: v.optional(TypeMappingsSchema),
  
  /** Whether to emit one C# file per TypeScript module */
  filePerModule: v.optional(v.boolean(), true),
  
  /** Enable watch mode for incremental compilation */
  watch: v.optional(v.boolean(), false),
  
  /** Strategy for handling discriminated unions */
  discriminatedUnionStrategy: v.optional(
    v.picklist(['abstract-subclass', 'tagged-struct']),
    'abstract-subclass'
  ),
});

/**
 * Inferred TypeScript type for transpiler configuration
 */
export type TranspilerConfig = v.InferOutput<typeof TranspilerConfigSchema>;

/**
 * Inferred TypeScript type for type mappings
 */
export type TypeMappings = v.InferOutput<typeof TypeMappingsSchema>;

/**
 * Validate and parse a configuration object
 */
export function parseConfig(config: unknown): TranspilerConfig {
  return v.parse(TranspilerConfigSchema, config);
}

/**
 * Safely parse configuration, returning result with success/failure
 */
export function safeParseConfig(config: unknown): v.SafeParseResult<typeof TranspilerConfigSchema> {
  return v.safeParse(TranspilerConfigSchema, config);
}

