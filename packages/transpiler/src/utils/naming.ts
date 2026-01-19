/**
 * Naming convention utilities for TypeScript to C# transpilation
 */

/**
 * Convert a string to PascalCase
 * 
 * Examples:
 * - camelCase -> CamelCase
 * - snake_case -> SnakeCase
 * - kebab-case -> KebabCase
 * - already_Pascal -> AlreadyPascal
 */
export function toPascalCase(str: string): string {
  if (!str) return str;
  
  return str
    // Handle snake_case and kebab-case
    .replace(/[-_]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? '')
    // Capitalize first letter
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

/**
 * Convert a string to camelCase
 */
export function toCamelCase(str: string): string {
  if (!str) return str;
  
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert a TypeScript method name to C# naming convention
 * 
 * - Regular methods: preserve original name (camelCase stays camelCase)
 * - Godot lifecycle methods: _ready -> _Ready, _process -> _Process (Godot requires this)
 */
export function toMethodName(tsName: string): string {
  // Godot lifecycle methods start with underscore - these need PascalCase after underscore
  if (tsName.startsWith('_')) {
    // _ready -> _Ready, _process -> _Process, _physics_process -> _PhysicsProcess
    const withoutUnderscore = tsName.slice(1);
    return '_' + toPascalCase(withoutUnderscore);
  }
  
  // Preserve original method name for TypeScript-native feel
  return tsName;
}

/**
 * Convert a TypeScript property name to C# naming convention
 * 
 * - Public properties: camelCase -> PascalCase (optional, configurable)
 * - Private properties: _name -> _name (preserve underscore prefix)
 */
export function toPropertyName(tsName: string, isPrivate = false): string {
  // Private fields with underscore prefix are kept as-is
  if (isPrivate && tsName.startsWith('_')) {
    return tsName;
  }
  
  // For now, keep property names as-is (matches Godot C# style guide)
  // Godot uses lowercase for fields: public float health;
  return tsName;
}

/**
 * Convert a discriminant value to a C# class name
 * 
 * Examples:
 * - 'circle' -> Circle
 * - 'user-created' -> UserCreated
 * - 'HTTP_ERROR' -> HttpError
 */
export function toClassName(discriminantValue: string): string {
  // Handle special cases
  const normalized = discriminantValue
    // Handle SCREAMING_SNAKE_CASE
    .toLowerCase()
    // Replace special characters with spaces for processing
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();
  
  // Convert to PascalCase
  return normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Check if a name is a C# reserved keyword
 */
export function isCSharpKeyword(name: string): boolean {
  const keywords = new Set([
    'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch',
    'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default',
    'delegate', 'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern',
    'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if',
    'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock', 'long',
    'namespace', 'new', 'null', 'object', 'operator', 'out', 'override',
    'params', 'private', 'protected', 'public', 'readonly', 'ref', 'return',
    'sbyte', 'sealed', 'short', 'sizeof', 'stackalloc', 'static', 'string',
    'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint',
    'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual', 'void',
    'volatile', 'while',
  ]);
  
  return keywords.has(name);
}

/**
 * Escape a name if it's a C# keyword
 */
export function escapeCSharpKeyword(name: string): string {
  if (isCSharpKeyword(name)) {
    return `@${name}`;
  }
  return name;
}

/**
 * Convert a file path to a namespace segment
 * 
 * Examples:
 * - 'entities/player' -> 'Entities'
 * - 'utils/math-helpers' -> 'Utils'
 */
export function pathToNamespace(relativePath: string): string {
  // Normalize path separators
  const normalized = relativePath.replace(/\\/g, '/');
  
  // Get directory parts (exclude filename)
  const parts = normalized.split('/').filter(Boolean);
  
  // Remove the filename (last part if it has an extension)
  if (parts.length > 0 && parts[parts.length - 1]?.includes('.')) {
    parts.pop();
  }
  
  // Convert each part to PascalCase and join with dots
  return parts.map(toPascalCase).join('.');
}

