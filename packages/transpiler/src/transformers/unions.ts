/**
 * Union type analysis utilities
 */

import { TypeAliasDeclaration, TypeNode, SyntaxKind, TypeLiteralNode } from 'ts-morph';

/**
 * Represents a discriminated union type
 */
export interface DiscriminatedUnion {
  /** Name of the union type */
  name: string;
  /** Name of the discriminant property (e.g., 'kind', 'type') */
  discriminantProperty: string;
  /** Type of the discriminant values */
  discriminantType: 'string' | 'number' | 'boolean';
  /** Individual variants of the union */
  variants: UnionVariant[];
  /** Properties shared by all variants (besides discriminant) */
  sharedProperties: PropertyInfo[];
}

/**
 * Represents a single variant of a discriminated union
 */
export interface UnionVariant {
  /** The discriminant value for this variant (e.g., 'circle', 'square') */
  discriminantValue: string;
  /** Suggested class name for this variant (PascalCase) */
  className: string;
  /** Properties unique to this variant */
  properties: PropertyInfo[];
}

/**
 * Property information
 */
export interface PropertyInfo {
  name: string;
  typeName: string;
  isOptional: boolean;
}

/**
 * Check if a type alias is a discriminated union
 */
export function isDiscriminatedUnion(typeAlias: TypeAliasDeclaration): boolean {
  const typeNode = typeAlias.getTypeNode();
  if (!typeNode?.isKind(SyntaxKind.UnionType)) {
    return false;
  }

  const unionTypes = typeNode.getTypeNodes();
  if (unionTypes.length < 2) {
    return false;
  }

  // All members must be object types
  const allObjectTypes = unionTypes.every(t => 
    t.isKind(SyntaxKind.TypeLiteral) || t.isKind(SyntaxKind.TypeReference)
  );
  if (!allObjectTypes) {
    return false;
  }

  // Find a common discriminant property with literal types
  const discriminant = findDiscriminantProperty(unionTypes);
  return discriminant !== null;
}

/**
 * Analyze a discriminated union type alias
 */
export function analyzeDiscriminatedUnion(typeAlias: TypeAliasDeclaration): DiscriminatedUnion | null {
  const name = typeAlias.getName();
  const typeNode = typeAlias.getTypeNode();
  
  if (!typeNode?.isKind(SyntaxKind.UnionType)) {
    return null;
  }

  const unionTypes = typeNode.getTypeNodes();
  const discriminant = findDiscriminantProperty(unionTypes);
  
  if (!discriminant) {
    return null;
  }

  const variants: UnionVariant[] = [];
  
  for (const memberType of unionTypes) {
    if (!memberType.isKind(SyntaxKind.TypeLiteral)) {
      continue;
    }

    const variant = analyzeVariant(memberType, discriminant.name);
    if (variant) {
      variants.push(variant);
    }
  }

  // Find shared properties (excluding discriminant)
  const sharedProperties = findSharedProperties(unionTypes, discriminant.name);

  return {
    name,
    discriminantProperty: discriminant.name,
    discriminantType: discriminant.type,
    variants,
    sharedProperties,
  };
}

/**
 * Find the discriminant property in union members
 */
function findDiscriminantProperty(unionTypes: TypeNode[]): { name: string; type: 'string' | 'number' | 'boolean' } | null {
  // Get properties from first member
  const firstMember = unionTypes[0];
  if (!firstMember?.isKind(SyntaxKind.TypeLiteral)) {
    return null;
  }

  const firstProperties = firstMember.getProperties();

  for (const prop of firstProperties) {
    const propName = prop.getName();
    const propType = prop.getTypeNode();
    
    // Check if this property has a literal type
    if (!propType?.isKind(SyntaxKind.LiteralType)) {
      continue;
    }

    // Check if all other members have this property with different literal values
    let isDiscriminant = true;
    let discriminantType: 'string' | 'number' | 'boolean' = 'string';
    const seenValues = new Set<string>();
    
    for (const member of unionTypes) {
      if (!member.isKind(SyntaxKind.TypeLiteral)) {
        isDiscriminant = false;
        break;
      }

      const memberProp = member.getProperty(propName);
      if (!memberProp) {
        isDiscriminant = false;
        break;
      }

      const memberPropType = memberProp.getTypeNode();
      if (!memberPropType?.isKind(SyntaxKind.LiteralType)) {
        isDiscriminant = false;
        break;
      }

      const literal = memberPropType.getLiteral();
      let value: string;
      
      if (literal.isKind(SyntaxKind.StringLiteral)) {
        value = literal.getLiteralValue();
        discriminantType = 'string';
      } else if (literal.isKind(SyntaxKind.NumericLiteral)) {
        value = String(literal.getLiteralValue());
        discriminantType = 'number';
      } else if (literal.isKind(SyntaxKind.TrueKeyword) || literal.isKind(SyntaxKind.FalseKeyword)) {
        value = literal.getText();
        discriminantType = 'boolean';
      } else {
        isDiscriminant = false;
        break;
      }

      if (seenValues.has(value)) {
        // Duplicate value - not a valid discriminant
        isDiscriminant = false;
        break;
      }
      seenValues.add(value);
    }

    if (isDiscriminant && seenValues.size === unionTypes.length) {
      return { name: propName, type: discriminantType };
    }
  }

  return null;
}

/**
 * Analyze a single variant of a discriminated union
 */
function analyzeVariant(typeLiteral: TypeLiteralNode, discriminantProp: string): UnionVariant | null {
  const properties = typeLiteral.getProperties();
  const discriminantProperty = typeLiteral.getProperty(discriminantProp);
  
  if (!discriminantProperty) {
    return null;
  }

  // Get discriminant value
  const discriminantType = discriminantProperty.getTypeNode();
  if (!discriminantType?.isKind(SyntaxKind.LiteralType)) {
    return null;
  }

  const literal = discriminantType.getLiteral();
  let discriminantValue: string;
  
  if (literal.isKind(SyntaxKind.StringLiteral)) {
    discriminantValue = literal.getLiteralValue();
  } else if (literal.isKind(SyntaxKind.NumericLiteral)) {
    discriminantValue = String(literal.getLiteralValue());
  } else {
    discriminantValue = literal.getText();
  }

  // Generate class name from discriminant value
  const className = toClassName(discriminantValue);

  // Get other properties (excluding discriminant)
  const variantProperties: PropertyInfo[] = [];
  
  for (const prop of properties) {
    if (prop.getName() === discriminantProp) {
      continue;
    }

    variantProperties.push({
      name: prop.getName(),
      typeName: prop.getTypeNode()?.getText() ?? 'object',
      isOptional: prop.hasQuestionToken(),
    });
  }

  return {
    discriminantValue,
    className,
    properties: variantProperties,
  };
}

/**
 * Find properties shared by all union members
 */
function findSharedProperties(unionTypes: TypeNode[], discriminantProp: string): PropertyInfo[] {
  if (unionTypes.length === 0) {
    return [];
  }

  const firstMember = unionTypes[0];
  if (!firstMember?.isKind(SyntaxKind.TypeLiteral)) {
    return [];
  }

  const sharedProps: PropertyInfo[] = [];
  
  for (const prop of firstMember.getProperties()) {
    const propName = prop.getName();
    
    // Skip discriminant
    if (propName === discriminantProp) {
      continue;
    }

    // Check if all other members have this property with same type
    let isShared = true;
    const propTypeName = prop.getTypeNode()?.getText() ?? 'object';
    
    for (let i = 1; i < unionTypes.length; i++) {
      const member = unionTypes[i];
      if (!member?.isKind(SyntaxKind.TypeLiteral)) {
        isShared = false;
        break;
      }

      const memberProp = member.getProperty(propName);
      if (!memberProp) {
        isShared = false;
        break;
      }

      const memberPropTypeName = memberProp.getTypeNode()?.getText() ?? 'object';
      if (memberPropTypeName !== propTypeName) {
        isShared = false;
        break;
      }
    }

    if (isShared) {
      sharedProps.push({
        name: propName,
        typeName: propTypeName,
        isOptional: prop.hasQuestionToken(),
      });
    }
  }

  return sharedProps;
}

/**
 * Convert a discriminant value to a class name
 */
function toClassName(value: string): string {
  // Handle various casing styles
  return value
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

