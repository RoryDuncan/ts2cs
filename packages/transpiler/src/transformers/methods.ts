/**
 * Method transformation utilities
 */

import { MethodDeclaration, ParameterDeclaration, ClassDeclaration, ConstructorDeclaration } from 'ts-morph';
import { ResolvedTypeMappings } from '../config/schema.js';
import { transformType } from './types.js';
import { getModifiers, formatModifiers } from './modifiers.js';
import { toMethodName } from '../utils/naming.js';

/**
 * Transpile a class method to C#
 */
export function transpileMethod(
  method: MethodDeclaration,
  mappings: ResolvedTypeMappings,
  indent: string = '    '
): string {
  const tsName = method.getName();
  const csName = toMethodName(tsName);
  const returnTypeNode = method.getReturnTypeNode();
  const modifiers = getModifiers(method);
  const parameters = method.getParameters();
  const body = method.getBody();

  // Get C# return type
  const returnType = transformType(returnTypeNode, mappings);

  // Build parameter list
  const paramList = parameters.map(p => transpileParameter(p, mappings)).join(', ');

  // Build method signature
  const modifierStr = formatModifiers(modifiers);
  let signature = `${indent}${modifierStr} ${returnType} ${csName}(${paramList})`;

  // Handle abstract methods (no body)
  if (modifiers.isAbstract || !body) {
    return `${signature};`;
  }

  // Transpile method body
  const bodyContent = transpileMethodBody(body.getText(), indent);

  // Handle empty body
  if (!bodyContent.trim()) {
    return `${signature}\n${indent}{\n${indent}}`;
  }

  return `${signature}\n${indent}{\n${bodyContent}\n${indent}}`;
}

/**
 * Transpile a parameter declaration to C#
 */
export function transpileParameter(
  param: ParameterDeclaration,
  mappings: ResolvedTypeMappings
): string {
  const name = param.getName();
  const typeNode = param.getTypeNode();
  const initializer = param.getInitializer();
  const isOptional = param.hasQuestionToken();

  let csharpType = transformType(typeNode, mappings);
  
  // Make optional parameters nullable
  if (isOptional && !csharpType.endsWith('?')) {
    csharpType += '?';
  }

  let result = `${csharpType} ${name}`;

  // Add default value for optional parameters
  if (isOptional && !initializer) {
    result += ' = null';
  } else if (initializer) {
    result += ` = ${transpileInitializerValue(initializer.getText())}`;
  }

  return result;
}

/**
 * Transpile a constructor to C#
 */
export function transpileConstructor(
  ctor: ConstructorDeclaration,
  className: string,
  mappings: ResolvedTypeMappings,
  indent: string = '    '
): string {
  const parameters = ctor.getParameters();
  const body = ctor.getBody();
  const modifiers = getModifiers(ctor);

  // Build parameter list
  const paramList = parameters.map(p => transpileParameter(p, mappings)).join(', ');

  // Build constructor signature
  const modifierStr = modifiers.access;
  let signature = `${indent}${modifierStr} ${className}(${paramList})`;

  // Transpile constructor body
  if (!body) {
    return `${signature}\n${indent}{\n${indent}}`;
  }

  const bodyContent = transpileMethodBody(body.getText(), indent);

  // Handle empty body
  if (!bodyContent.trim()) {
    return `${signature}\n${indent}{\n${indent}}`;
  }

  return `${signature}\n${indent}{\n${bodyContent}\n${indent}}`;
}

/**
 * Transpile all methods from a class
 */
export function transpileClassMethods(
  classDecl: ClassDeclaration,
  mappings: ResolvedTypeMappings,
  indent: string = '    '
): string[] {
  const methods = classDecl.getMethods();
  return methods.map(method => transpileMethod(method, mappings, indent));
}

/**
 * Transpile all constructors from a class
 */
export function transpileClassConstructors(
  classDecl: ClassDeclaration,
  mappings: ResolvedTypeMappings,
  indent: string = '    '
): string[] {
  const ctors = classDecl.getConstructors();
  const className = classDecl.getName() ?? 'UnnamedClass';
  return ctors.map(ctor => transpileConstructor(ctor, className, mappings, indent));
}

/**
 * Transpile a method body (basic implementation)
 * For now, does simple transformations. Full expression transpilation is complex.
 */
function transpileMethodBody(bodyText: string, indent: string): string {
  // Remove outer braces
  let content = bodyText.trim();
  if (content.startsWith('{')) {
    content = content.slice(1);
  }
  if (content.endsWith('}')) {
    content = content.slice(0, -1);
  }
  content = content.trim();

  if (!content) {
    return '';
  }

  // Split into lines and add indentation
  const lines = content.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    
    // Basic transformations
    let transformed = trimmed;
    
    // Convert console.log to GD.Print
    transformed = transformed.replace(/console\.log\(/g, 'GD.Print(');
    
    // Convert this. to this. (same in C#)
    // No change needed
    
    return `${indent}    ${transformed}`;
  });

  return lines.filter(l => l.trim()).join('\n');
}

/**
 * Transpile an initializer value for a parameter default
 */
function transpileInitializerValue(value: string): string {
  // Basic transformations
  if (value === 'undefined') return 'null';
  if (value === 'null') return 'null';
  if (value === 'true' || value === 'false') return value;
  
  // String literals - convert single quotes to double
  if (value.startsWith("'") && value.endsWith("'")) {
    return `"${value.slice(1, -1)}"`;
  }
  
  return value;
}

