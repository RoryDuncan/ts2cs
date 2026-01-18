/**
 * Type transformation utilities
 * 
 * Handles mapping TypeScript types to C# types.
 */

import { TypeNode, Type, SyntaxKind } from 'ts-morph';
import { ResolvedTypeMappings } from '../config/schema.js';

/**
 * Transform a TypeScript type to its C# equivalent
 */
export function transformType(
  typeNode: TypeNode | undefined,
  mappings: ResolvedTypeMappings
): string {
  if (!typeNode) {
    return 'object'; // Default for untyped
  }

  const kind = typeNode.getKind();

  // Handle primitive types
  switch (kind) {
    case SyntaxKind.StringKeyword:
      return mappings.string;
    case SyntaxKind.NumberKeyword:
      return mappings.number;
    case SyntaxKind.BooleanKeyword:
      return mappings.boolean;
    case SyntaxKind.VoidKeyword:
      return mappings.void;
    case SyntaxKind.AnyKeyword:
      return mappings.any;
    case SyntaxKind.UnknownKeyword:
      return mappings.unknown;
    case SyntaxKind.NullKeyword:
      return mappings.null;
    case SyntaxKind.UndefinedKeyword:
      return mappings.undefined;
    case SyntaxKind.NeverKeyword:
      return 'void'; // Never has no direct equivalent
    case SyntaxKind.ObjectKeyword:
      return 'object';
  }

  // Handle array types: T[]
  if (typeNode.isKind(SyntaxKind.ArrayType)) {
    const elementType = typeNode.getElementTypeNode();
    const elementCSharp = transformType(elementType, mappings);
    return `${elementCSharp}[]`;
  }

  // Handle generic Array<T>
  if (typeNode.isKind(SyntaxKind.TypeReference)) {
    const typeName = typeNode.getTypeName().getText();
    
    if (typeName === 'Array') {
      const typeArgs = typeNode.getTypeArguments();
      if (typeArgs.length === 1) {
        const elementCSharp = transformType(typeArgs[0], mappings);
        return `${elementCSharp}[]`;
      }
    }
    
    // Other type references - return as-is for now
    return typeName;
  }

  // Handle union types (T | null, T | undefined)
  if (typeNode.isKind(SyntaxKind.UnionType)) {
    return transformUnionType(typeNode, mappings);
  }

  // Handle literal types
  if (typeNode.isKind(SyntaxKind.LiteralType)) {
    const literal = typeNode.getLiteral();
    if (literal.isKind(SyntaxKind.StringLiteral)) {
      return 'string';
    }
    if (literal.isKind(SyntaxKind.NumericLiteral)) {
      return mappings.number;
    }
    if (literal.isKind(SyntaxKind.TrueKeyword) || literal.isKind(SyntaxKind.FalseKeyword)) {
      return mappings.boolean;
    }
    if (literal.isKind(SyntaxKind.NullKeyword)) {
      return mappings.null;
    }
  }

  // Handle tuple types
  if (typeNode.isKind(SyntaxKind.TupleType)) {
    const elements = typeNode.getElements();
    const elementTypes = elements.map(el => transformType(el, mappings));
    return `(${elementTypes.join(', ')})`;
  }

  // Handle function types
  if (typeNode.isKind(SyntaxKind.FunctionType)) {
    // For now, map to Action or Func
    const returnType = typeNode.getReturnTypeNode();
    const returnCSharp = transformType(returnType, mappings);
    const params = typeNode.getParameters();
    
    if (returnCSharp === 'void') {
      if (params.length === 0) {
        return 'Action';
      }
      const paramTypes = params.map(p => transformType(p.getTypeNode(), mappings));
      return `Action<${paramTypes.join(', ')}>`;
    } else {
      const paramTypes = params.map(p => transformType(p.getTypeNode(), mappings));
      if (paramTypes.length === 0) {
        return `Func<${returnCSharp}>`;
      }
      return `Func<${paramTypes.join(', ')}, ${returnCSharp}>`;
    }
  }

  // Fallback: use the text representation
  return typeNode.getText();
}

/**
 * Transform a union type to C#
 */
function transformUnionType(
  typeNode: TypeNode,
  mappings: ResolvedTypeMappings
): string {
  if (!typeNode.isKind(SyntaxKind.UnionType)) {
    return transformType(typeNode, mappings);
  }

  const unionTypes = typeNode.getTypeNodes();
  
  // Check for nullable pattern: T | null or T | undefined
  const nonNullTypes = unionTypes.filter(t => {
    if (t.isKind(SyntaxKind.LiteralType)) {
      const literal = t.getLiteral();
      return !literal.isKind(SyntaxKind.NullKeyword);
    }
    return !t.isKind(SyntaxKind.NullKeyword) && !t.isKind(SyntaxKind.UndefinedKeyword);
  });

  const hasNull = unionTypes.some(t => {
    if (t.isKind(SyntaxKind.LiteralType)) {
      const literal = t.getLiteral();
      return literal.isKind(SyntaxKind.NullKeyword);
    }
    return t.isKind(SyntaxKind.NullKeyword) || t.isKind(SyntaxKind.UndefinedKeyword);
  });

  // If it's T | null or T | undefined, return T?
  if (hasNull && nonNullTypes.length === 1) {
    const baseType = transformType(nonNullTypes[0], mappings);
    return `${baseType}?`;
  }

  // For other unions, return object (or could be a discriminated union)
  // Complex unions will be handled by the discriminated union transformer
  if (unionTypes.length > 1) {
    return 'object';
  }

  return transformType(unionTypes[0], mappings);
}

/**
 * Get the C# type for a TypeScript Type (resolved type, not TypeNode)
 */
export function transformResolvedType(
  type: Type,
  mappings: ResolvedTypeMappings
): string {
  const text = type.getText();
  
  // Check for basic types
  if (type.isString() || type.isStringLiteral()) {
    return mappings.string;
  }
  if (type.isNumber() || type.isNumberLiteral()) {
    return mappings.number;
  }
  if (type.isBoolean() || type.isBooleanLiteral()) {
    return mappings.boolean;
  }
  if (type.isNull()) {
    return mappings.null;
  }
  if (type.isUndefined()) {
    return mappings.undefined;
  }
  if (type.isAny()) {
    return mappings.any;
  }
  if (type.isUnknown()) {
    return mappings.unknown;
  }
  if (type.isVoid()) {
    return mappings.void;
  }
  if (type.isNever()) {
    return 'void';
  }
  
  // Check for array
  if (type.isArray()) {
    const elementType = type.getArrayElementType();
    if (elementType) {
      const elementCSharp = transformResolvedType(elementType, mappings);
      return `${elementCSharp}[]`;
    }
    return 'object[]';
  }
  
  // Check for union with null/undefined (nullable)
  if (type.isUnion()) {
    const unionTypes = type.getUnionTypes();
    const nonNullTypes = unionTypes.filter(t => !t.isNull() && !t.isUndefined());
    const hasNull = unionTypes.some(t => t.isNull() || t.isUndefined());
    
    if (hasNull && nonNullTypes.length === 1) {
      const baseType = transformResolvedType(nonNullTypes[0]!, mappings);
      return `${baseType}?`;
    }
  }
  
  // Fallback
  return text;
}

