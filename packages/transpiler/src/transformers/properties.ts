/**
 * Property transformation utilities
 */

import { PropertyDeclaration, ClassDeclaration } from 'ts-morph';
import { ResolvedTypeMappings } from '../config/schema.js';
import { transformType } from './types.js';
import { getModifiers, formatModifiers } from './modifiers.js';

/**
 * Transpile a class property to C#
 */
export function transpileProperty(
  property: PropertyDeclaration,
  mappings: ResolvedTypeMappings,
  indent: string = '    '
): string {
  const name = property.getName();
  const typeNode = property.getTypeNode();
  const initializer = property.getInitializer();
  const modifiers = getModifiers(property);
  const isOptional = property.hasQuestionToken();

  // Get C# type
  let csharpType = transformType(typeNode, mappings);
  
  // Make optional properties nullable
  if (isOptional && !csharpType.endsWith('?')) {
    csharpType += '?';
  }

  // Build the field declaration
  const modifierStr = formatModifiers(modifiers);
  
  let declaration = `${indent}${modifierStr} ${csharpType} ${name}`;
  
  // Add initializer if present
  if (initializer) {
    const initText = transpileInitializer(initializer.getText(), csharpType, mappings);
    declaration += ` = ${initText}`;
  }
  
  declaration += ';';
  
  return declaration;
}

/**
 * Transpile all properties from a class
 */
export function transpileClassProperties(
  classDecl: ClassDeclaration,
  mappings: ResolvedTypeMappings,
  indent: string = '    '
): string[] {
  const properties = classDecl.getProperties();
  return properties.map(prop => transpileProperty(prop, mappings, indent));
}

/**
 * Transpile an initializer expression
 * Basic transformation - more complex expressions handled by expression transformer
 */
function transpileInitializer(
  tsInitializer: string,
  _targetType: string,
  _mappings: ResolvedTypeMappings
): string {
  // Simple literal transformations
  
  // Boolean literals
  if (tsInitializer === 'true' || tsInitializer === 'false') {
    return tsInitializer;
  }
  
  // Null/undefined
  if (tsInitializer === 'null' || tsInitializer === 'undefined') {
    return 'null';
  }
  
  // String literals - keep as-is (C# uses same syntax)
  if (tsInitializer.startsWith('"') || tsInitializer.startsWith("'")) {
    // Convert single quotes to double quotes for C#
    if (tsInitializer.startsWith("'")) {
      const content = tsInitializer.slice(1, -1);
      return `"${content}"`;
    }
    return tsInitializer;
  }
  
  // Template literals - convert to string interpolation
  if (tsInitializer.startsWith('`')) {
    return convertTemplateString(tsInitializer);
  }
  
  // Array literals
  if (tsInitializer.startsWith('[')) {
    return convertArrayLiteral(tsInitializer);
  }
  
  // Number literals - keep as-is
  if (/^-?\d+(\.\d+)?$/.test(tsInitializer)) {
    return tsInitializer;
  }
  
  // For complex expressions, return as-is for now
  return tsInitializer;
}

/**
 * Convert TypeScript template string to C# interpolated string
 */
function convertTemplateString(template: string): string {
  // Remove backticks
  const content = template.slice(1, -1);
  
  // Replace ${expr} with {expr}
  const converted = content.replace(/\$\{([^}]+)\}/g, '{$1}');
  
  return `$"${converted}"`;
}

/**
 * Convert TypeScript array literal to C# array initializer
 */
function convertArrayLiteral(arrayLiteral: string): string {
  // [1, 2, 3] -> new[] { 1, 2, 3 }
  // [] -> Array.Empty<T>() or new T[] {}
  
  const content = arrayLiteral.slice(1, -1).trim();
  
  if (content === '') {
    // Empty array - use Array.Empty or explicit array
    // For now, return a simple empty array
    return 'new[] { }';
  }
  
  // Convert array literal to C# syntax
  return `new[] { ${content} }`;
}

