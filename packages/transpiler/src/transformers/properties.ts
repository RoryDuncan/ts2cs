/**
 * Property transformation utilities
 */

import { PropertyDeclaration, ClassDeclaration } from "ts-morph";
import { ResolvedTypeMappings } from "../config/schema.js";
import { TranspileContext, addInferenceWarning } from "../transpiler.js";
import { transformType, transformResolvedType } from "./types.js";
import { getModifiers, formatModifiers } from "./modifiers.js";
import { escapeCSharpKeyword } from "../utils/naming.js";
import { transpileDecorators } from "./decorators.js";

/**
 * Transpile a class property to C#
 */
export function transpileProperty(
  property: PropertyDeclaration,
  context: TranspileContext,
  indent = "    "
): string {
  const mappings = context.mappings;
  const name = property.getName();
  const escapedName = escapeCSharpKeyword(name);
  const typeNode = property.getTypeNode();
  const initializer = property.getInitializer();
  const modifiers = getModifiers(property);
  const isOptional = property.hasQuestionToken();
  const decorators = property.getDecorators();

  // Get C# type - use explicit type if available, otherwise infer
  let csharpType: string;
  if (typeNode) {
    csharpType = transformType(typeNode, mappings);
  } else {
    // Use TypeScript's type inference
    const inferredType = property.getType();
    csharpType = transformResolvedType(inferredType, mappings);
    // Add warning about inferred type
    addInferenceWarning(context, "property", name, csharpType, property.getStartLineNumber());
  }

  // Make optional properties nullable
  if (isOptional && !csharpType.endsWith("?")) {
    csharpType += "?";
  }

  // Build the field declaration
  const modifierStr = formatModifiers(modifiers);

  const lines: string[] = [];

  // Add C# attributes from decorators
  const attrs = transpileDecorators(decorators, indent);
  lines.push(...attrs);

  let declaration = `${indent}${modifierStr} ${csharpType} ${escapedName}`;

  // Add initializer if present
  if (initializer) {
    const initText = transpileInitializer(initializer.getText(), csharpType, mappings);
    declaration += ` = ${initText}`;
  }

  declaration += ";";
  lines.push(declaration);

  return lines.join("\n");
}

/**
 * Transpile all properties from a class
 */
export function transpileClassProperties(
  classDecl: ClassDeclaration,
  context: TranspileContext,
  indent = "    "
): string[] {
  const properties = classDecl.getProperties();
  return properties.map((prop) => transpileProperty(prop, context, indent));
}

/**
 * Transpile an initializer expression
 * Basic transformation - more complex expressions handled by expression transformer
 */
function transpileInitializer(tsInitializer: string, targetType: string, mappings: ResolvedTypeMappings): string {
  // Simple literal transformations

  // Boolean literals
  if (tsInitializer === "true" || tsInitializer === "false") {
    return tsInitializer;
  }

  // Null/undefined
  if (tsInitializer === "null" || tsInitializer === "undefined") {
    return "null";
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
  if (tsInitializer.startsWith("`")) {
    return convertTemplateString(tsInitializer);
  }

  // Array literals
  if (tsInitializer.startsWith("[")) {
    return convertArrayLiteral(tsInitializer, targetType, mappings);
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
  const converted = content.replace(/\$\{([^}]+)\}/g, "{$1}");

  return `$"${converted}"`;
}

/**
 * Convert TypeScript array literal to C# array/list initializer
 */
function convertArrayLiteral(arrayLiteral: string, targetType: string, mappings: ResolvedTypeMappings): string {
  const content = arrayLiteral.slice(1, -1).trim();
  const transform = mappings.arrayTransform;

  // Extract element type from targetType
  // List<T> -> T, T[] -> T, Godot.Collections.Array<T> -> T
  const elementType = extractElementType(targetType);

  switch (transform) {
    case "array":
      if (content === "") {
        // Empty array - C# cannot infer type, must use explicit type
        return `new ${elementType}[] { }`;
      }
      return `new[] { ${content} }`;

    case "list":
      if (content === "") {
        return `new List<${elementType}>()`;
      }
      return `new List<${elementType}> { ${content} }`;

    case "godot-array":
      if (content === "") {
        return `new Godot.Collections.Array<${elementType}>()`;
      }
      return `new Godot.Collections.Array<${elementType}> { ${content} }`;
  }
}

/**
 * Extract element type from a collection type string
 * List<T> -> T, T[] -> T, Godot.Collections.Array<T> -> T
 */
function extractElementType(collectionType: string): string {
  // Handle T[] format
  if (collectionType.endsWith("[]")) {
    return collectionType.slice(0, -2);
  }

  // Handle Generic<T> format (List<T>, Godot.Collections.Array<T>, etc.)
  const genericRegex = /<(.+)>$/;
  const genericMatch = genericRegex.exec(collectionType);
  if (genericMatch?.[1]) {
    return genericMatch[1];
  }

  // Fallback - can't determine element type, use object
  return "object";
}
