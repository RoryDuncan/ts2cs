/**
 * Discriminated union transpilation
 * 
 * Generates abstract base class + subclasses pattern from TypeScript
 * discriminated unions.
 */

import { TypeAliasDeclaration } from 'ts-morph';
import { ResolvedTypeMappings } from '../config/schema.js';
import { analyzeDiscriminatedUnion, DiscriminatedUnion, PropertyInfo } from './unions.js';

/**
 * Transpile a discriminated union to C# classes
 */
export function transpileDiscriminatedUnion(
  typeAlias: TypeAliasDeclaration,
  mappings: ResolvedTypeMappings,
  indent: string = ''
): string | null {
  const union = analyzeDiscriminatedUnion(typeAlias);
  
  if (!union) {
    return null;
  }

  const parts: string[] = [];

  // Generate base class
  parts.push(generateBaseClass(union, mappings, indent));

  // Generate variant classes
  for (const variant of union.variants) {
    parts.push('');
    parts.push(generateVariantClass(union, variant, mappings, indent));
  }

  return parts.join('\n');
}

/**
 * Generate the abstract base class for a discriminated union
 */
function generateBaseClass(
  union: DiscriminatedUnion,
  mappings: ResolvedTypeMappings,
  indent: string
): string {
  const lines: string[] = [];
  
  // Class declaration
  lines.push(`${indent}public abstract partial class ${union.name}`);
  lines.push(`${indent}{`);
  
  // Abstract discriminant property
  const discriminantCSharpType = getDiscriminantCSharpType(union.discriminantType);
  lines.push(`${indent}    public abstract ${discriminantCSharpType} ${toPascalCase(union.discriminantProperty)} { get; }`);
  
  // Shared properties
  for (const prop of union.sharedProperties) {
    const csharpType = mapTypeName(prop.typeName, mappings);
    const optionalMarker = prop.isOptional ? '?' : '';
    lines.push(`${indent}    public ${csharpType}${optionalMarker} ${prop.name};`);
  }
  
  lines.push(`${indent}}`);
  
  return lines.join('\n');
}

/**
 * Generate a variant subclass for a discriminated union
 */
function generateVariantClass(
  union: DiscriminatedUnion,
  variant: { discriminantValue: string; className: string; properties: PropertyInfo[] },
  mappings: ResolvedTypeMappings,
  indent: string
): string {
  const lines: string[] = [];
  
  // Class declaration
  lines.push(`${indent}public partial class ${variant.className} : ${union.name}`);
  lines.push(`${indent}{`);
  
  // Override discriminant property
  const discriminantCSharpType = getDiscriminantCSharpType(union.discriminantType);
  const discriminantValue = formatDiscriminantValue(variant.discriminantValue, union.discriminantType);
  lines.push(`${indent}    public override ${discriminantCSharpType} ${toPascalCase(union.discriminantProperty)} => ${discriminantValue};`);
  
  // Variant-specific properties
  for (const prop of variant.properties) {
    const csharpType = mapTypeName(prop.typeName, mappings);
    const optionalMarker = prop.isOptional ? '?' : '';
    lines.push(`${indent}    public ${csharpType}${optionalMarker} ${prop.name};`);
  }
  
  lines.push(`${indent}}`);
  
  return lines.join('\n');
}

/**
 * Get C# type for discriminant
 */
function getDiscriminantCSharpType(tsType: 'string' | 'number' | 'boolean'): string {
  switch (tsType) {
    case 'string': return 'string';
    case 'number': return 'int';
    case 'boolean': return 'bool';
  }
}

/**
 * Format discriminant value for C#
 */
function formatDiscriminantValue(value: string, type: 'string' | 'number' | 'boolean'): string {
  switch (type) {
    case 'string': return `"${value}"`;
    case 'number': return value;
    case 'boolean': return value;
  }
}

/**
 * Map a TypeScript type name to C#
 */
function mapTypeName(tsTypeName: string, mappings: ResolvedTypeMappings): string {
  // Check basic types
  switch (tsTypeName) {
    case 'string': return mappings.string;
    case 'number': return mappings.number;
    case 'boolean': return mappings.boolean;
    case 'any': return mappings.any;
    case 'unknown': return mappings.unknown;
    case 'void': return mappings.void;
    case 'null': return mappings.null;
    case 'undefined': return mappings.undefined;
  }
  
  // Check for array syntax
  if (tsTypeName.endsWith('[]')) {
    const elementType = tsTypeName.slice(0, -2);
    return `${mapTypeName(elementType, mappings)}[]`;
  }
  
  // Return as-is for custom types
  return tsTypeName;
}

/**
 * Convert to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? '')
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

