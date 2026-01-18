/**
 * Enum transformation utilities
 */

import { EnumDeclaration } from 'ts-morph';
import { ResolvedTypeMappings } from '../config/schema.js';

/**
 * Transpile an enum declaration to C#
 */
export function transpileEnum(
  enumDecl: EnumDeclaration,
  _mappings: ResolvedTypeMappings,
  indent: string = ''
): string {
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
  
  lines.push(memberLines.join(',\n'));
  lines.push(`${indent}}`);
  
  return lines.join('\n');
}

/**
 * Transpile all enums from a source file
 */
export function transpileEnums(
  enums: EnumDeclaration[],
  mappings: ResolvedTypeMappings,
  indent: string = ''
): string[] {
  return enums.map(e => transpileEnum(e, mappings, indent));
}

