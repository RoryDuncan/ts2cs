import * as v from "valibot";

/**
 * Number type option - controls how TypeScript 'number' maps to C#
 */
export const NumberTypeSchema = v.picklist(["float", "double"]);
export type NumberType = v.InferOutput<typeof NumberTypeSchema>;

/**
 * Array transform option - controls how TypeScript arrays (T[], Array<T>) map to C#
 * - 'array': Native C# arrays (T[])
 * - 'list': System.Collections.Generic.List<T> (default)
 * - 'godot-array': Godot.Collections.Array<T>
 */
export const ArrayTransformSchema = v.picklist(["array", "list", "godot-array"]);
export type ArrayTransform = v.InferOutput<typeof ArrayTransformSchema>;

/**
 * TypedArray transform option - controls how TypeScript TypedArrays map to C#
 * - 'array': Native C# arrays with appropriate element type (default)
 * - 'span': System.Span<T> for memory-efficient access
 */
export const TypedArrayTransformSchema = v.picklist(["array", "span"]);
export type TypedArrayTransform = v.InferOutput<typeof TypedArrayTransformSchema>;

/**
 * Type mappings from TypeScript types to C# types
 */
export const TypeMappingsSchema = v.object({
  string: v.optional(v.string(), "string"),
  number: v.optional(v.string()), // Controlled by numberType config
  boolean: v.optional(v.string(), "bool"),
  any: v.optional(v.string(), "object"),
  unknown: v.optional(v.string(), "object"),
  void: v.optional(v.string(), "void"),
  null: v.optional(v.string(), "null"),
  undefined: v.optional(v.string(), "null")
});

/**
 * Main transpiler configuration schema
 */
export const TranspilerConfigSchema = v.object({
  /** Input directory containing TypeScript source files */
  inputDir: v.pipe(v.string(), v.minLength(1)),

  /** Output directory for generated C# files */
  outputDir: v.pipe(v.string(), v.minLength(1)),

  /**
   * Base C# namespace for generated code.
   * Sub-namespaces are derived from file paths.
   * Defaults to the input directory name in PascalCase.
   */
  namespace: v.optional(v.string()),

  /**
   * C# type to use for TypeScript 'number'.
   * - 'float': 32-bit, commonly used in Godot (default)
   * - 'double': 64-bit, matches JavaScript precision
   */
  numberType: v.optional(NumberTypeSchema, "float"),

  /**
   * How to transform TypeScript arrays (T[], Array<T>) to C#.
   * - 'list': System.Collections.Generic.List<T> (default)
   * - 'array': Native C# arrays (T[])
   * - 'godot-array': Godot.Collections.Array<T>
   */
  arrayTransform: v.optional(ArrayTransformSchema, "list"),

  /**
   * How to transform TypeScript TypedArrays (Int32Array, Float64Array, etc.) to C#.
   * - 'array': Native C# arrays with appropriate element type (default)
   * - 'span': System.Span<T> for memory-efficient access
   */
  typedArrayTransform: v.optional(TypedArrayTransformSchema, "array"),

  /** Custom type mappings from TS to C# (overrides defaults) */
  typeMappings: v.optional(TypeMappingsSchema),

  /** Whether to emit one C# file per TypeScript module */
  filePerModule: v.optional(v.boolean(), true),

  /** Enable watch mode for incremental compilation */
  watch: v.optional(v.boolean(), false),

  /** Strategy for handling discriminated unions */
  discriminatedUnionStrategy: v.optional(v.picklist(["abstract-subclass", "tagged-struct"]), "abstract-subclass"),

  /**
   * Whether to include the auto-generated header comment in output.
   * - true: Include the default auto-generated header
   * - false: No header in output (default)
   */
  includeHeader: v.optional(v.boolean(), false)
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

/**
 * Resolved type mappings with all defaults applied
 */
export interface ResolvedTypeMappings {
  string: string;
  number: string;
  boolean: string;
  any: string;
  unknown: string;
  void: string;
  null: string;
  undefined: string;

  // Array transformation settings
  arrayTransform: ArrayTransform;
  typedArrayTransform: TypedArrayTransform;

  // Import type qualification (set at transpilation time)
  /** Map of imported type names to their namespace (for subdirectory imports) */
  importedTypes?: Map<string, string>;
}

/**
 * Get the resolved type mappings with defaults applied
 */
export function getTypeMappings(config: TranspilerConfig): ResolvedTypeMappings {
  const numberType = config.numberType ?? "float";
  const customMappings = config.typeMappings;

  return {
    string: customMappings?.string ?? "string",
    number: customMappings?.number ?? numberType,
    boolean: customMappings?.boolean ?? "bool",
    any: customMappings?.any ?? "object",
    unknown: customMappings?.unknown ?? "object",
    void: customMappings?.void ?? "void",
    null: customMappings?.null ?? "null",
    undefined: customMappings?.undefined ?? "null",

    // Array transformation settings
    arrayTransform: config.arrayTransform ?? "list",
    typedArrayTransform: config.typedArrayTransform ?? "array"
  };
}

/**
 * Get the resolved namespace, defaulting to directory name if not provided
 */
export function getNamespace(config: TranspilerConfig): string {
  if (config.namespace) {
    return config.namespace;
  }
  // Default to PascalCase of last directory segment
  const parts = config.inputDir.replace(/\\/g, "/").split("/").filter(Boolean);
  const lastPart = parts[parts.length - 1] ?? "GameScripts";
  return toPascalCase(lastPart);
}

/**
 * Convert a string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? "")
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}
