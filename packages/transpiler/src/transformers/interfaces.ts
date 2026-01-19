/**
 * Interface transformation utilities
 */

import { 
  InterfaceDeclaration, 
  PropertySignature,
  MethodSignature,
} from 'ts-morph';
import { ResolvedTypeMappings } from '../config/schema.js';
import { transformType } from './types.js';
import { escapeCSharpKeyword, toMethodName } from '../utils/naming.js';

/**
 * Transpile an interface declaration to C#
 */
export function transpileInterface(
  interfaceDecl: InterfaceDeclaration,
  mappings: ResolvedTypeMappings,
  indent = ''
): string {
  const name = interfaceDecl.getName();
  
  // Ensure interface name starts with I (C# convention)
  const csName = name.startsWith('I') ? name : `I${name}`;
  
  // Get type parameters (generics)
  const typeParams = interfaceDecl.getTypeParameters();
  const typeParamStr = typeParams.length > 0 
    ? `<${typeParams.map(tp => tp.getName()).join(', ')}>` 
    : '';
  
  // Get base interfaces (extends clause)
  const extendsClause = interfaceDecl.getExtends();
  const baseInterfaces = extendsClause.map(ext => {
    const baseName = ext.getText();
    // Ensure base interface also has I prefix
    return baseName.startsWith('I') ? baseName : `I${baseName}`;
  });
  
  const lines: string[] = [];
  
  // Build interface declaration with inheritance
  if (baseInterfaces.length > 0) {
    lines.push(`${indent}public interface ${csName}${typeParamStr} : ${baseInterfaces.join(', ')}`);
  } else {
    lines.push(`${indent}public interface ${csName}${typeParamStr}`);
  }
  lines.push(`${indent}{`);
  
  // Transpile properties
  const properties = interfaceDecl.getProperties();
  for (const prop of properties) {
    lines.push(transpileInterfaceProperty(prop, mappings, indent + '    '));
  }
  
  // Transpile methods
  const methods = interfaceDecl.getMethods();
  for (const method of methods) {
    lines.push(transpileInterfaceMethod(method, mappings, indent + '    '));
  }
  
  lines.push(`${indent}}`);
  
  return lines.join('\n');
}

/**
 * Transpile an interface property to C#
 */
function transpileInterfaceProperty(
  prop: PropertySignature,
  mappings: ResolvedTypeMappings,
  indent: string
): string {
  const name = escapeCSharpKeyword(prop.getName());
  const typeNode = prop.getTypeNode();
  const isOptional = prop.hasQuestionToken();
  
  let csType = transformType(typeNode, mappings);
  
  // Make optional properties nullable
  if (isOptional && !csType.endsWith('?')) {
    csType += '?';
  }
  
  // Interface properties in C# need get/set
  return `${indent}${csType} ${name} { get; set; }`;
}

/**
 * Transpile an interface method to C#
 */
function transpileInterfaceMethod(
  method: MethodSignature,
  mappings: ResolvedTypeMappings,
  indent: string
): string {
  // Preserve original method name for TypeScript-native feel
  const name = toMethodName(method.getName());
  const returnTypeNode = method.getReturnTypeNode();
  const returnType = transformType(returnTypeNode, mappings);
  
  // Build parameter list
  const params = method.getParameters();
  const paramList = params.map(p => {
    const paramName = escapeCSharpKeyword(p.getName());
    const paramType = transformType(p.getTypeNode(), mappings);
    return `${paramType} ${paramName}`;
  }).join(', ');
  
  return `${indent}${returnType} ${name}(${paramList});`;
}

/**
 * Transpile all interfaces from a source file
 */
export function transpileInterfaces(
  interfaces: InterfaceDeclaration[],
  mappings: ResolvedTypeMappings,
  indent = ''
): string[] {
  return interfaces.map(i => transpileInterface(i, mappings, indent));
}

