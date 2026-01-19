/**
 * Accessor (getter/setter) transformation utilities
 */

import { ClassDeclaration, Block } from "ts-morph";
import { ResolvedTypeMappings } from "../config/schema.js";
import { transformType } from "./types.js";
import { getModifiers, formatModifiers } from "./modifiers.js";
import { escapeCSharpKeyword } from "../utils/naming.js";
import { transpileStatements } from "./statements.js";

/**
 * Represents a C# property with getters and/or setters
 */
interface CSharpProperty {
  name: string;
  type: string;
  modifiers: string;
  getter?: string;
  setter?: string;
}

/**
 * Transpile class accessors to C# properties
 *
 * Groups getters and setters with the same name into a single C# property.
 */
export function transpileClassAccessors(
  classDecl: ClassDeclaration,
  mappings: ResolvedTypeMappings,
  indent = "    "
): string[] {
  const getters = classDecl.getGetAccessors();
  const setters = classDecl.getSetAccessors();

  // Group by property name
  const propertyMap = new Map<string, CSharpProperty>();

  // Process getters
  for (const getter of getters) {
    const name = getter.getName();
    const escapedName = escapeCSharpKeyword(name);
    const returnType = transformType(getter.getReturnTypeNode(), mappings);
    const modifiers = getModifiers(getter);
    const modifierStr = formatModifiers(modifiers);

    const body = getter.getBody() as Block | undefined;
    const getterBody = transpileAccessorBody(body, mappings, indent);

    if (!propertyMap.has(name)) {
      propertyMap.set(name, {
        name: escapedName,
        type: returnType,
        modifiers: modifierStr,
        getter: getterBody
      });
    } else {
      const prop = propertyMap.get(name)!;
      prop.getter = getterBody;
    }
  }

  // Process setters
  for (const setter of setters) {
    const name = setter.getName();
    const escapedName = escapeCSharpKeyword(name);
    const modifiers = getModifiers(setter);
    const modifierStr = formatModifiers(modifiers);

    // Get type from setter parameter
    const params = setter.getParameters();
    const paramType = params.length > 0 && params[0] ? transformType(params[0].getTypeNode(), mappings) : "object";

    const body = setter.getBody() as Block | undefined;
    const setterBody = transpileAccessorBody(body, mappings, indent);

    if (!propertyMap.has(name)) {
      propertyMap.set(name, {
        name: escapedName,
        type: paramType,
        modifiers: modifierStr,
        setter: setterBody
      });
    } else {
      const prop = propertyMap.get(name)!;
      prop.setter = setterBody;
    }
  }

  // Generate C# properties
  const results: string[] = [];

  for (const prop of propertyMap.values()) {
    results.push(generateCSharpProperty(prop, indent));
  }

  return results;
}

/**
 * Transpile accessor body to C# expression or block
 */
function transpileAccessorBody(body: Block | undefined, mappings: ResolvedTypeMappings, indent: string): string {
  if (!body) {
    return "";
  }

  const statements = body.getStatements();

  if (statements.length === 0) {
    return "";
  }

  // For single return statement, use expression body
  if (statements.length === 1) {
    const stmt = statements[0]!;
    const text = stmt.getText().trim();

    // return this._health; -> => _health
    if (text.startsWith("return ") && text.endsWith(";")) {
      const expr = text.slice(7, -1).trim();
      // Transform this._x to _x
      const csExpr = expr.replace(/^this\./, "");
      return csExpr;
    }

    // this._health = value; -> => _health = value
    if (text.includes("=") && text.endsWith(";")) {
      const csExpr = text.slice(0, -1).replace(/^this\./, "");
      return csExpr;
    }
  }

  // Multiple statements - use block body
  const bodyContent = transpileStatements(statements, mappings, indent + "        ");
  return `\n${indent}        {\n${bodyContent}\n${indent}        }`;
}

/**
 * Generate a C# property declaration
 */
function generateCSharpProperty(prop: CSharpProperty, indent: string): string {
  const { name, type, modifiers, getter, setter } = prop;

  // Simple expression-body properties
  if (getter && !setter) {
    if (!getter.includes("\n")) {
      return `${indent}${modifiers} ${type} ${name} { get => ${getter}; }`;
    }
  }

  if (setter && !getter) {
    if (!setter.includes("\n")) {
      return `${indent}${modifiers} ${type} ${name} { set => ${setter}; }`;
    }
  }

  if (getter && setter) {
    const isSimple = !getter.includes("\n") && !setter.includes("\n");

    if (isSimple) {
      return `${indent}${modifiers} ${type} ${name}\n${indent}{\n${indent}    get => ${getter};\n${indent}    set => ${setter};\n${indent}}`;
    }
  }

  // Complex block-body properties
  const lines: string[] = [];
  lines.push(`${indent}${modifiers} ${type} ${name}`);
  lines.push(`${indent}{`);

  if (getter) {
    if (getter.includes("\n")) {
      lines.push(`${indent}    get${getter}`);
    } else {
      lines.push(`${indent}    get => ${getter};`);
    }
  }

  if (setter) {
    if (setter.includes("\n")) {
      lines.push(`${indent}    set${setter}`);
    } else {
      lines.push(`${indent}    set => ${setter};`);
    }
  }

  lines.push(`${indent}}`);

  return lines.join("\n");
}
