/**
 * Access modifier transformation utilities
 */

import { 
  PropertyDeclaration, 
  ConstructorDeclaration,
  SyntaxKind,
  GetAccessorDeclaration,
  SetAccessorDeclaration,
  MethodDeclaration,
  Node,
} from 'ts-morph';

export type AccessModifier = 'public' | 'private' | 'protected' | 'internal';

export interface CSharpModifiers {
  access: AccessModifier;
  isStatic: boolean;
  isReadonly: boolean;
  isAbstract: boolean;
  isVirtual: boolean;
  isOverride: boolean;
  isAsync: boolean;
}

type ModifiableNode = PropertyDeclaration | MethodDeclaration | ConstructorDeclaration | GetAccessorDeclaration | SetAccessorDeclaration;

/**
 * Extract C# modifiers from a class member
 */
export function getModifiers(member: ModifiableNode): CSharpModifiers {
  const modifiers: CSharpModifiers = {
    access: 'public', // Default in C#
    isStatic: false,
    isReadonly: false,
    isAbstract: false,
    isVirtual: false,
    isOverride: false,
    isAsync: false,
  };

  // Check access modifiers
  if (hasModifier(member, SyntaxKind.PrivateKeyword)) {
    modifiers.access = 'private';
  } else if (hasModifier(member, SyntaxKind.ProtectedKeyword)) {
    modifiers.access = 'protected';
  }
  // Public is default, no explicit check needed

  // Check other modifiers
  modifiers.isStatic = hasModifier(member, SyntaxKind.StaticKeyword);
  modifiers.isReadonly = hasModifier(member, SyntaxKind.ReadonlyKeyword);
  modifiers.isAbstract = hasModifier(member, SyntaxKind.AbstractKeyword);
  modifiers.isAsync = hasModifier(member, SyntaxKind.AsyncKeyword);
  
  // Note: override is handled separately in method context
  // Virtual and override are typically inferred from class hierarchy

  return modifiers;
}

/**
 * Check if a member has a specific modifier
 */
function hasModifier(member: ModifiableNode, kind: SyntaxKind): boolean {
  const modifiers = member.getModifiers();
  return modifiers.some((m: Node) => m.getKind() === kind);
}

/**
 * Format modifiers for C# output
 */
export function formatModifiers(modifiers: CSharpModifiers): string {
  const parts: string[] = [];

  // Access modifier
  parts.push(modifiers.access);

  // Other modifiers in C# order
  if (modifiers.isStatic) {
    parts.push('static');
  }
  if (modifiers.isAbstract) {
    parts.push('abstract');
  }
  if (modifiers.isVirtual) {
    parts.push('virtual');
  }
  if (modifiers.isOverride) {
    parts.push('override');
  }
  if (modifiers.isAsync) {
    parts.push('async');
  }
  if (modifiers.isReadonly) {
    parts.push('readonly');
  }

  return parts.join(' ');
}

/**
 * Check if a property should be treated as a field or property
 * Properties with getters/setters are C# properties, others are fields
 */
export function isPropertyAccessor(_member: PropertyDeclaration): boolean {
  // In TypeScript, all class properties without get/set are fields
  // This function is for future use when we support getters/setters
  return false;
}
