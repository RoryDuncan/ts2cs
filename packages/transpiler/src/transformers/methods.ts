/**
 * Method transformation utilities
 */

import {
  MethodDeclaration,
  ParameterDeclaration,
  ClassDeclaration,
  ConstructorDeclaration,
  Block,
  SyntaxKind
} from "ts-morph";
import { ResolvedTypeMappings } from "../config/schema.js";
import { TranspileContext, addInferenceWarning } from "../transpiler.js";
import { transformType, inferMethodReturnType } from "./types.js";
import { getModifiers, formatModifiers, AccessModifier } from "./modifiers.js";
import { toMethodName, escapeCSharpKeyword } from "../utils/naming.js";
import { transpileStatements } from "./statements.js";
import { transpileDecorators } from "./decorators.js";

/**
 * Represents a parameter property that should generate a field
 */
interface ParameterProperty {
  name: string;
  escapedName: string;
  type: string;
  access: AccessModifier;
}

/**
 * Transpile a class method to C#
 */
export function transpileMethod(
  method: MethodDeclaration,
  context: TranspileContext,
  indent = "    "
): string {
  const mappings = context.mappings;
  const tsName = method.getName();
  const csName = toMethodName(tsName);
  const returnTypeNode = method.getReturnTypeNode();
  const modifiers = getModifiers(method);
  const parameters = method.getParameters();
  const body = method.getBody();
  const decorators = method.getDecorators();
  const typeParams = method.getTypeParameters();

  // Get C# return type - use explicit type if available, otherwise infer from return type
  let returnType: string;
  if (returnTypeNode) {
    returnType = transformType(returnTypeNode, mappings);
  } else {
    // Use TypeScript's type inference
    const inferredType = method.getReturnType();
    returnType = inferMethodReturnType(inferredType, modifiers.isAsync, mappings);
    // Add warning about inferred return type
    addInferenceWarning(context, "method", tsName, returnType, method.getStartLineNumber());
  }

  // Build parameter list
  const paramList = parameters.map((p) => transpileParameter(p, mappings)).join(", ");

  // Build type parameters (generics)
  let typeParamStr = "";
  if (typeParams.length > 0) {
    const typeParamNames = typeParams.map((tp) => tp.getName());
    typeParamStr = `<${typeParamNames.join(", ")}>`;
  }

  // Build method signature
  const modifierStr = formatModifiers(modifiers);

  const lines: string[] = [];

  // Add C# attributes from decorators
  const attrs = transpileDecorators(decorators, indent);
  lines.push(...attrs);

  // Build generic constraints (where clauses)
  let constraintStr = "";
  for (const tp of typeParams) {
    const constraint = tp.getConstraint();
    if (constraint) {
      constraintStr += ` where ${tp.getName()} : ${constraint.getText()}`;
    }
  }

  const signature = `${indent}${modifierStr} ${returnType} ${csName}${typeParamStr}(${paramList})${constraintStr}`;

  // Handle abstract methods (no body)
  if (modifiers.isAbstract || !body) {
    lines.push(`${signature};`);
    return lines.join("\n");
  }

  // Transpile method body (pass context for warnings)
  const bodyContent = transpileMethodBodyBlock(body as Block, mappings, indent, context);

  // Handle empty body
  if (!bodyContent.trim()) {
    lines.push(`${signature}\n${indent}{\n${indent}}`);
    return lines.join("\n");
  }

  lines.push(`${signature}\n${indent}{\n${bodyContent}\n${indent}}`);
  return lines.join("\n");
}

/**
 * Transpile a parameter declaration to C#
 */
export function transpileParameter(param: ParameterDeclaration, mappings: ResolvedTypeMappings): string {
  const name = param.getName();
  const escapedName = escapeCSharpKeyword(name);
  const typeNode = param.getTypeNode();
  const initializer = param.getInitializer();
  const isOptional = param.hasQuestionToken();
  const isRestParam = param.isRestParameter();

  let csharpType = transformType(typeNode, mappings);

  // Make optional parameters nullable (but not rest parameters)
  if (isOptional && !isRestParam && !csharpType.endsWith("?")) {
    csharpType += "?";
  }

  // Rest parameters use 'params' keyword in C#
  // TypeScript: ...args: string[] -> C#: params string[] args
  let result = "";
  if (isRestParam) {
    // For rest parameters, we need to use native array syntax with params
    // Convert List<T> to T[] for params
    let arrayType = csharpType;
    if (csharpType.startsWith("List<") && csharpType.endsWith(">")) {
      const elementType = csharpType.slice(5, -1);
      arrayType = `${elementType}[]`;
    } else if (csharpType.startsWith("Godot.Collections.Array<") && csharpType.endsWith(">")) {
      const elementType = csharpType.slice(24, -1);
      arrayType = `${elementType}[]`;
    }
    result = `params ${arrayType} ${escapedName}`;
  } else {
    result = `${csharpType} ${escapedName}`;

    // Add default value for optional parameters
    if (isOptional && !initializer) {
      result += " = null";
    } else if (initializer) {
      result += ` = ${transpileInitializerValue(initializer.getText())}`;
    }
  }

  return result;
}

/**
 * Extract parameter properties from a constructor
 * Parameter properties are parameters with access modifiers (public, private, protected)
 */
export function extractParameterProperties(
  ctor: ConstructorDeclaration,
  mappings: ResolvedTypeMappings
): ParameterProperty[] {
  const properties: ParameterProperty[] = [];

  for (const param of ctor.getParameters()) {
    const modifiers = param.getModifiers();
    let access: AccessModifier | null = null;

    for (const mod of modifiers) {
      const kind = mod.getKind();
      if (kind === SyntaxKind.PublicKeyword) {
        access = "public";
        break;
      } else if (kind === SyntaxKind.PrivateKeyword) {
        access = "private";
        break;
      } else if (kind === SyntaxKind.ProtectedKeyword) {
        access = "protected";
        break;
      }
    }

    if (access) {
      const name = param.getName();
      const typeNode = param.getTypeNode();
      const csType = transformType(typeNode, mappings);

      properties.push({
        name,
        escapedName: escapeCSharpKeyword(name),
        type: csType,
        access
      });
    }
  }

  return properties;
}

/**
 * Generate field declarations for parameter properties
 */
export function generateParameterPropertyFields(properties: ParameterProperty[], indent = "    "): string[] {
  return properties.map((prop) => `${indent}${prop.access} ${prop.type} ${prop.escapedName};`);
}

/**
 * Generate assignment statements for parameter properties
 */
function generateParameterPropertyAssignments(properties: ParameterProperty[], indent: string): string {
  if (properties.length === 0) {
    return "";
  }

  return properties.map((prop) => `${indent}this.${prop.escapedName} = ${prop.escapedName};`).join("\n");
}

/**
 * Transpile a constructor to C#
 */
export function transpileConstructor(
  ctor: ConstructorDeclaration,
  className: string,
  mappings: ResolvedTypeMappings,
  indent = "    ",
  parameterProperties: ParameterProperty[] = []
): string {
  const parameters = ctor.getParameters();
  const body = ctor.getBody();
  const modifiers = getModifiers(ctor);

  // Build parameter list (without access modifiers for parameter properties)
  const paramList = parameters.map((p) => transpileConstructorParameter(p, mappings)).join(", ");

  // Build constructor signature
  const modifierStr = modifiers.access;
  const signature = `${indent}${modifierStr} ${className}(${paramList})`;

  // Generate parameter property assignments
  const propAssignments = generateParameterPropertyAssignments(parameterProperties, indent + "    ");

  // Transpile constructor body
  let bodyContent = "";
  if (body) {
    bodyContent = transpileMethodBodyBlock(body as Block, mappings, indent);
  }

  // Combine property assignments with body content
  const allBodyContent = [propAssignments, bodyContent].filter((s) => s.trim()).join("\n");

  // Handle empty body
  if (!allBodyContent.trim()) {
    return `${signature}\n${indent}{\n${indent}}`;
  }

  return `${signature}\n${indent}{\n${allBodyContent}\n${indent}}`;
}

/**
 * Transpile a constructor parameter (without access modifiers)
 */
function transpileConstructorParameter(param: ParameterDeclaration, mappings: ResolvedTypeMappings): string {
  const name = param.getName();
  const escapedName = escapeCSharpKeyword(name);
  const typeNode = param.getTypeNode();
  const initializer = param.getInitializer();
  const isOptional = param.hasQuestionToken();

  let csharpType = transformType(typeNode, mappings);

  // Make optional parameters nullable
  if (isOptional && !csharpType.endsWith("?")) {
    csharpType += "?";
  }

  let result = `${csharpType} ${escapedName}`;

  // Add default value for optional parameters
  if (isOptional && !initializer) {
    result += " = null";
  } else if (initializer) {
    result += ` = ${transpileInitializerValue(initializer.getText())}`;
  }

  return result;
}

/**
 * Transpile all methods from a class
 */
export function transpileClassMethods(
  classDecl: ClassDeclaration,
  context: TranspileContext,
  indent = "    "
): string[] {
  const methods = classDecl.getMethods();
  return methods.map((method) => transpileMethod(method, context, indent));
}

/**
 * Result of transpiling constructors including generated fields
 */
export interface ConstructorTranspileResult {
  fields: string[];
  constructors: string[];
}

/**
 * Transpile all constructors from a class, including parameter property fields
 */
export function transpileClassConstructors(
  classDecl: ClassDeclaration,
  context: TranspileContext,
  indent = "    "
): ConstructorTranspileResult {
  const mappings = context.mappings;
  const ctors = classDecl.getConstructors();
  const className = classDecl.getName() ?? "UnnamedClass";

  const allFields: string[] = [];
  const allConstructors: string[] = [];

  for (const ctor of ctors) {
    // Extract parameter properties
    const paramProps = extractParameterProperties(ctor, mappings);

    // Generate fields for parameter properties
    const fields = generateParameterPropertyFields(paramProps, indent);
    allFields.push(...fields);

    // Generate constructor with parameter property assignments
    const ctorCode = transpileConstructor(ctor, className, mappings, indent, paramProps);
    allConstructors.push(ctorCode);
  }

  return { fields: allFields, constructors: allConstructors };
}

/**
 * Transpile a method body block using the statement transpiler
 */
function transpileMethodBodyBlock(
  block: Block,
  mappings: ResolvedTypeMappings,
  indent: string,
  context?: TranspileContext
): string {
  const statements = block.getStatements();

  if (statements.length === 0) {
    return "";
  }

  return transpileStatements(statements, mappings, indent + "    ", context);
}

/**
 * Transpile an initializer value for a parameter default
 */
function transpileInitializerValue(value: string): string {
  // Basic transformations
  if (value === "undefined") return "null";
  if (value === "null") return "null";
  if (value === "true" || value === "false") return value;

  // String literals - convert single quotes to double
  if (value.startsWith("'") && value.endsWith("'")) {
    return `"${value.slice(1, -1)}"`;
  }

  return value;
}
