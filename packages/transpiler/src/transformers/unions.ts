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
  discriminantType: 'string' | 'number' | 'boolean' | 'enum';
  /** For enum discriminants, the name of the enum type */
  enumTypeName?: string;
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

  // Find shared properties first (excluding discriminant)
  const sharedProperties = findSharedProperties(unionTypes, discriminant.name);
  const sharedPropNames = new Set(sharedProperties.map(p => p.name));

  const variants: UnionVariant[] = [];
  
  for (const memberType of unionTypes) {
    if (!memberType.isKind(SyntaxKind.TypeLiteral)) {
      continue;
    }

    // Pass shared property names to exclude them from variant-specific properties
    const variant = analyzeVariant(memberType, discriminant.name, sharedPropNames);
    if (variant) {
      variants.push(variant);
    }
  }

  return {
    name,
    discriminantProperty: discriminant.name,
    discriminantType: discriminant.type,
    enumTypeName: discriminant.enumTypeName,
    variants,
    sharedProperties,
  };
}

/**
 * Discriminant property result
 */
interface DiscriminantResult {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  enumTypeName?: string;
}

/**
 * Find the discriminant property in union members
 */
function findDiscriminantProperty(unionTypes: TypeNode[]): DiscriminantResult | null {
  // Get properties from first member
  const firstMember = unionTypes[0];
  if (!firstMember?.isKind(SyntaxKind.TypeLiteral)) {
    return null;
  }

  const firstProperties = firstMember.getProperties();

  for (const prop of firstProperties) {
    const propName = prop.getName();
    const propType = prop.getTypeNode();
    
    if (!propType) {
      continue;
    }
    
    // Check if this property has a literal type or type reference (for enum members)
    const isLiteralType = propType.isKind(SyntaxKind.LiteralType);
    const isTypeReference = propType.isKind(SyntaxKind.TypeReference);
    
    if (!isLiteralType && !isTypeReference) {
      continue;
    }

    // Check if all other members have this property with different values
    let isDiscriminant = true;
    let discriminantType: 'string' | 'number' | 'boolean' | 'enum' = 'string';
    let enumTypeName: string | undefined;
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
      if (!memberPropType) {
        isDiscriminant = false;
        break;
      }
      
      let value: string;
      
      // Handle literal types (string, number, boolean)
      if (memberPropType.isKind(SyntaxKind.LiteralType)) {
        const literal = memberPropType.getLiteral();
        
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
      }
      // Handle type references (enum member access like ShapeKind.Circle)
      else if (memberPropType.isKind(SyntaxKind.TypeReference)) {
        const typeText = memberPropType.getText();
        // Check if it's an enum member access (contains a dot)
        if (typeText.includes('.')) {
          const parts = typeText.split('.');
          const currentEnumName = parts[0] ?? '';
          const memberName = parts[1] ?? '';
          
          if (!currentEnumName || !memberName) {
            isDiscriminant = false;
            break;
          }
          
          // All enum discriminants must be from the same enum
          if (enumTypeName && enumTypeName !== currentEnumName) {
            isDiscriminant = false;
            break;
          }
          
          enumTypeName = currentEnumName;
          discriminantType = 'enum';
          value = memberName;
        } else {
          isDiscriminant = false;
          break;
        }
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
      return { name: propName, type: discriminantType, enumTypeName };
    }
  }

  return null;
}

/**
 * Analyze a single variant of a discriminated union
 * @param sharedPropNames - Names of properties that are shared across all variants (to exclude)
 */
function analyzeVariant(
  typeLiteral: TypeLiteralNode, 
  discriminantProp: string,
  sharedPropNames = new Set<string>()
): UnionVariant | null {
  const properties = typeLiteral.getProperties();
  const discriminantProperty = typeLiteral.getProperty(discriminantProp);
  
  if (!discriminantProperty) {
    return null;
  }

  // Get discriminant value - can be a literal or enum member reference
  const discriminantTypeNode = discriminantProperty.getTypeNode();
  if (!discriminantTypeNode) {
    return null;
  }
  
  let discriminantValue: string;
  let isNumeric = false;
  let isBoolean = false;
  let isEnum = false;
  
  // Handle literal types (string, number, boolean)
  if (discriminantTypeNode.isKind(SyntaxKind.LiteralType)) {
    const literal = discriminantTypeNode.getLiteral();
    
    if (literal.isKind(SyntaxKind.StringLiteral)) {
      discriminantValue = literal.getLiteralValue();
    } else if (literal.isKind(SyntaxKind.NumericLiteral)) {
      discriminantValue = String(literal.getLiteralValue());
      isNumeric = true;
    } else if (literal.isKind(SyntaxKind.TrueKeyword) || literal.isKind(SyntaxKind.FalseKeyword)) {
      discriminantValue = literal.getText();
      isBoolean = true;
    } else {
      discriminantValue = literal.getText();
    }
  }
  // Handle type references (enum member access like ShapeKind.Circle)
  else if (discriminantTypeNode.isKind(SyntaxKind.TypeReference)) {
    const typeText = discriminantTypeNode.getText();
    if (typeText.includes('.')) {
      // Extract enum member name (e.g., "Circle" from "ShapeKind.Circle")
      const parts = typeText.split('.');
      const memberName = parts[1];
      if (!memberName) {
        return null;
      }
      discriminantValue = memberName;
      isEnum = true;
    } else {
      return null;
    }
  } else {
    return null;
  }

  // Generate class name from discriminant value
  const className = toClassName(discriminantValue, isNumeric, isBoolean, discriminantProp, isEnum);

  // Get other properties (excluding discriminant and shared properties)
  const variantProperties: PropertyInfo[] = [];
  
  for (const prop of properties) {
    const propName = prop.getName();
    
    // Skip discriminant and shared properties
    if (propName === discriminantProp || sharedPropNames.has(propName)) {
      continue;
    }

    variantProperties.push({
      name: propName,
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
 * @param isNumeric - If true, value is a number and needs special handling
 * @param isBoolean - If true, value is a boolean (true/false)
 * @param discriminantProp - The discriminant property name (used for numeric class names)
 * @param isEnum - If true, value is an enum member name (already PascalCase)
 */
function toClassName(
  value: string,
  isNumeric = false,
  isBoolean = false,
  discriminantProp = '',
  isEnum = false
): string {
  // For enum discriminants, the value is already the enum member name (typically PascalCase)
  if (isEnum) {
    return value;
  }
  
  // For numeric discriminants, prefix with PascalCase property name
  // e.g., code: 1 -> Code1, code: 200 -> Code200
  if (isNumeric) {
    const prefix = toPascalCase(discriminantProp);
    return `${prefix}${value}`;
  }
  
  // For boolean discriminants, use SuccessTrue/SuccessFalse pattern
  if (isBoolean) {
    const prefix = toPascalCase(discriminantProp);
    const suffix = value === 'true' ? 'True' : 'False';
    return `${prefix}${suffix}`;
  }
  
  // Handle various casing styles for string values
  return value
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Convert to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_]+(.)?/g, (_, c: string | undefined) => c?.toUpperCase() ?? '')
    .replace(/^(.)/, (_, c: string) => c.toUpperCase());
}

