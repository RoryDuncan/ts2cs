/**
 * Expression transformation utilities
 *
 * Transforms TypeScript expressions to C# equivalents
 */

import {
  Expression,
  SyntaxKind,
  BinaryExpression,
  CallExpression,
  ArrowFunction,
  PrefixUnaryExpression,
  PostfixUnaryExpression,
  PropertyAccessExpression,
  ElementAccessExpression,
  ConditionalExpression,
  ParenthesizedExpression
} from "ts-morph";
import { ResolvedTypeMappings } from "../config/schema.js";
import { transformType } from "./types.js";
import { escapeCSharpKeyword } from "../utils/naming.js";

/**
 * Transform a TypeScript expression to C#
 */
export function transpileExpression(expr: Expression | undefined, mappings: ResolvedTypeMappings, indent = ""): string {
  if (!expr) return "";

  const kind = expr.getKind();

  switch (kind) {
    // Literals
    case SyntaxKind.StringLiteral:
      return transpileStringLiteral(expr.getText());

    case SyntaxKind.NumericLiteral:
      return expr.getText();

    case SyntaxKind.TrueKeyword:
    case SyntaxKind.FalseKeyword:
      return expr.getText();

    case SyntaxKind.NullKeyword:
      return "null";

    case SyntaxKind.UndefinedKeyword:
      return "null";

    // Template literals
    case SyntaxKind.TemplateExpression:
    case SyntaxKind.NoSubstitutionTemplateLiteral:
      return transpileTemplateLiteral(expr.getText());

    // Binary expressions (a + b, a === b, etc.)
    case SyntaxKind.BinaryExpression:
      return transpileBinaryExpression(expr as BinaryExpression, mappings, indent);

    // Unary expressions
    case SyntaxKind.PrefixUnaryExpression:
      return transpilePrefixUnaryExpression(expr as PrefixUnaryExpression, mappings, indent);

    case SyntaxKind.PostfixUnaryExpression:
      return transpilePostfixUnaryExpression(expr as PostfixUnaryExpression, mappings, indent);

    // Call expression
    case SyntaxKind.CallExpression:
      return transpileCallExpression(expr as CallExpression, mappings, indent);

    // Arrow function
    case SyntaxKind.ArrowFunction:
      return transpileArrowFunction(expr as ArrowFunction, mappings, indent);

    // Property access (obj.prop)
    case SyntaxKind.PropertyAccessExpression:
      return transpilePropertyAccess(expr as PropertyAccessExpression, mappings, indent);

    // Element access (arr[0])
    case SyntaxKind.ElementAccessExpression:
      return transpileElementAccess(expr as ElementAccessExpression, mappings, indent);

    // Conditional (ternary)
    case SyntaxKind.ConditionalExpression:
      return transpileConditionalExpression(expr as ConditionalExpression, mappings, indent);

    // Parenthesized
    case SyntaxKind.ParenthesizedExpression:
      return `(${transpileExpression((expr as ParenthesizedExpression).getExpression(), mappings, indent)})`;

    // Identifier
    case SyntaxKind.Identifier:
      return escapeCSharpKeyword(expr.getText());

    // This
    case SyntaxKind.ThisKeyword:
      return "this";

    // Array literal
    case SyntaxKind.ArrayLiteralExpression:
      return transpileArrayLiteral(expr.getText());

    // Object literal
    case SyntaxKind.ObjectLiteralExpression:
      return transpileObjectLiteral(expr.getText());

    // Default: return as-is
    default:
      return expr.getText();
  }
}

/**
 * Transpile string literal (handle single quotes)
 */
function transpileStringLiteral(text: string): string {
  if (text.startsWith("'") && text.endsWith("'")) {
    const content = text.slice(1, -1);
    return `"${content}"`;
  }
  return text;
}

/**
 * Transpile template literal to C# interpolated string
 */
function transpileTemplateLiteral(text: string): string {
  // Remove backticks
  const content = text.slice(1, -1);

  // Replace ${expr} with {expr}
  const converted = content.replace(/\$\{([^}]+)\}/g, "{$1}");

  return `$"${converted}"`;
}

/**
 * Transpile binary expression
 */
function transpileBinaryExpression(expr: BinaryExpression, mappings: ResolvedTypeMappings, indent: string): string {
  const left = transpileExpression(expr.getLeft(), mappings, indent);
  const right = transpileExpression(expr.getRight(), mappings, indent);
  const op = expr.getOperatorToken();
  const opKind = op.getKind();

  // Transform operators
  let csOp: string;
  switch (opKind) {
    case SyntaxKind.EqualsEqualsEqualsToken:
      csOp = "==";
      break;
    case SyntaxKind.ExclamationEqualsEqualsToken:
      csOp = "!=";
      break;
    case SyntaxKind.AsteriskAsteriskToken:
      // ** -> Math.Pow() or Mathf.Pow() for Godot
      return `Mathf.Pow(${left}, ${right})`;
    default:
      csOp = op.getText();
  }

  return `${left} ${csOp} ${right}`;
}

/**
 * Transpile prefix unary expression (!x, -x, ++x, --x)
 */
function transpilePrefixUnaryExpression(
  expr: PrefixUnaryExpression,
  mappings: ResolvedTypeMappings,
  indent: string
): string {
  const operand = transpileExpression(expr.getOperand(), mappings, indent);
  const op = expr.getOperatorToken();
  return `${op}${operand}`;
}

/**
 * Transpile postfix unary expression (x++, x--)
 */
function transpilePostfixUnaryExpression(
  expr: PostfixUnaryExpression,
  mappings: ResolvedTypeMappings,
  indent: string
): string {
  const operand = transpileExpression(expr.getOperand(), mappings, indent);
  const opKind = expr.getOperatorToken();
  const op = opKind === SyntaxKind.PlusPlusToken ? "++" : "--";
  return `${operand}${op}`;
}

/**
 * Transpile call expression
 */
function transpileCallExpression(expr: CallExpression, mappings: ResolvedTypeMappings, indent: string): string {
  const callee = expr.getExpression();
  const args = expr.getArguments().map((a) => transpileExpression(a as Expression, mappings, indent));

  // Handle special cases
  const calleeText = callee.getText();

  // console.log -> GD.Print
  if (calleeText === "console.log") {
    return `GD.Print(${args.join(", ")})`;
  }

  // console.error -> GD.PrintErr
  if (calleeText === "console.error") {
    return `GD.PrintErr(${args.join(", ")})`;
  }

  // Math functions
  if (calleeText.startsWith("Math.")) {
    const mathFunc = calleeText.slice(5);
    return `Mathf.${toPascalCase(mathFunc)}(${args.join(", ")})`;
  }

  // Default: return as function call
  const transpCallee = transpileExpression(callee, mappings, indent);
  return `${transpCallee}(${args.join(", ")})`;
}

/**
 * Transpile arrow function to C# lambda
 */
function transpileArrowFunction(expr: ArrowFunction, mappings: ResolvedTypeMappings, indent: string): string {
  const params = expr.getParameters();
  const body = expr.getBody();

  // Build parameter list
  const paramList = params
    .map((p) => {
      const name = p.getName();
      const typeNode = p.getTypeNode();
      if (typeNode) {
        const csType = transformType(typeNode, mappings);
        return `${csType} ${name}`;
      }
      return name;
    })
    .join(", ");

  // Handle body
  if (body.getKind() === SyntaxKind.Block) {
    // Block body: (x) => { ... }
    const bodyText = transpileBlockBody(body.getText(), indent);
    return `(${paramList}) => ${bodyText}`;
  } else {
    // Expression body: (x) => x * 2
    const bodyExpr = transpileExpression(body as Expression, mappings, indent);
    return `(${paramList}) => ${bodyExpr}`;
  }
}

/**
 * Transpile block body for arrow functions
 */
function transpileBlockBody(bodyText: string, _indent: string): string {
  // For now, pass through with basic transformations
  let result = bodyText;
  result = result.replace(/console\.log\(/g, "GD.Print(");
  result = result.replace(/===/g, "==");
  result = result.replace(/!==/g, "!=");
  return result;
}

/**
 * Transpile property access
 */
function transpilePropertyAccess(
  expr: PropertyAccessExpression,
  mappings: ResolvedTypeMappings,
  indent: string
): string {
  const obj = transpileExpression(expr.getExpression(), mappings, indent);
  const prop = expr.getName();

  // Handle optional chaining if present
  if (expr.hasQuestionDotToken()) {
    return `${obj}?.${prop}`;
  }

  return `${obj}.${prop}`;
}

/**
 * Transpile element access (array indexing)
 */
function transpileElementAccess(expr: ElementAccessExpression, mappings: ResolvedTypeMappings, indent: string): string {
  const obj = transpileExpression(expr.getExpression(), mappings, indent);
  const arg = transpileExpression(expr.getArgumentExpression(), mappings, indent);

  // Handle optional chaining
  if (expr.hasQuestionDotToken()) {
    return `${obj}?[${arg}]`;
  }

  return `${obj}[${arg}]`;
}

/**
 * Transpile conditional (ternary) expression
 */
function transpileConditionalExpression(
  expr: ConditionalExpression,
  mappings: ResolvedTypeMappings,
  indent: string
): string {
  const condition = transpileExpression(expr.getCondition(), mappings, indent);
  const whenTrue = transpileExpression(expr.getWhenTrue(), mappings, indent);
  const whenFalse = transpileExpression(expr.getWhenFalse(), mappings, indent);

  return `${condition} ? ${whenTrue} : ${whenFalse}`;
}

/**
 * Transpile array literal
 */
function transpileArrayLiteral(text: string): string {
  const content = text.slice(1, -1).trim();
  if (content === "") {
    return "new[] { }";
  }
  return `new[] { ${content} }`;
}

/**
 * Transpile object literal (basic - for anonymous types or dictionaries)
 */
function transpileObjectLiteral(text: string): string {
  // For now, pass through - complex object literals need more work
  return text;
}

/**
 * Simple PascalCase converter for Math functions
 */
function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
