/**
 * Enum transformation utilities
 */

import { EnumDeclaration, SyntaxKind } from "ts-morph";
import { ResolvedTypeMappings } from "../config/schema.js";

/**
 * Check if an enum is a string enum (all values are strings)
 */
function isStringEnum(enumDecl: EnumDeclaration): boolean {
  const members = enumDecl.getMembers();

  if (members.length === 0) {
    return false;
  }

  return members.every((member) => {
    const initializer = member.getInitializer();
    if (!initializer) {
      return false;
    }
    return initializer.isKind(SyntaxKind.StringLiteral);
  });
}

/**
 * Transpile a string enum to a C# static class with string constants
 */
function transpileStringEnum(enumDecl: EnumDeclaration, indent: string): string {
  const name = enumDecl.getName();
  const members = enumDecl.getMembers();

  const lines: string[] = [];
  lines.push(`${indent}public static class ${name}`);
  lines.push(`${indent}{`);

  for (const member of members) {
    const memberName = member.getName();
    const initializer = member.getInitializer();
    const value = initializer?.getText() ?? `"${memberName}"`;

    lines.push(`${indent}    public const string ${memberName} = ${value};`);
  }

  lines.push(`${indent}}`);

  return lines.join("\n");
}

/**
 * Transpile a numeric enum to C#
 */
function transpileNumericEnum(enumDecl: EnumDeclaration, indent: string): string {
  const name = enumDecl.getName();
  const members = enumDecl.getMembers();

  const lines: string[] = [];
  lines.push(`${indent}public enum ${name}`);
  lines.push(`${indent}{`);

  const memberLines: string[] = [];

  for (const member of members) {
    const memberName = member.getName();
    const initializer = member.getInitializer();

    if (initializer) {
      // Enum member with explicit value
      const value = initializer.getText();
      memberLines.push(`${indent}    ${memberName} = ${value}`);
    } else {
      // Enum member without explicit value
      memberLines.push(`${indent}    ${memberName}`);
    }
  }

  lines.push(memberLines.join(",\n"));
  lines.push(`${indent}}`);

  return lines.join("\n");
}

/**
 * Transpile an enum declaration to C#
 */
export function transpileEnum(enumDecl: EnumDeclaration, _mappings: ResolvedTypeMappings, indent = ""): string {
  // Check if this is a string enum
  if (isStringEnum(enumDecl)) {
    return transpileStringEnum(enumDecl, indent);
  }

  // Default to numeric enum
  return transpileNumericEnum(enumDecl, indent);
}

/**
 * Transpile all enums from a source file
 */
export function transpileEnums(enums: EnumDeclaration[], mappings: ResolvedTypeMappings, indent = ""): string[] {
  return enums.map((e) => transpileEnum(e, mappings, indent));
}
