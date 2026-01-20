/**
 * Statement transformation utilities
 *
 * Transforms TypeScript statements to C# equivalents
 */

import {
  Statement,
  SyntaxKind,
  VariableStatement,
  IfStatement,
  ForStatement,
  ForOfStatement,
  ForInStatement,
  WhileStatement,
  DoStatement,
  ReturnStatement,
  ExpressionStatement,
  Block,
  Expression,
  ArrowFunction
} from "ts-morph";
import { ResolvedTypeMappings } from "../config/schema.js";
import { TranspileContext, addInferenceWarning } from "../transpiler.js";
import { transpileExpression } from "./expressions.js";
import { transformType, transformResolvedType } from "./types.js";
import { escapeCSharpKeyword } from "../utils/naming.js";

/**
 * Transpile a TypeScript statement to C#
 */
export function transpileStatement(
  stmt: Statement,
  mappings: ResolvedTypeMappings,
  indent = "    ",
  context?: TranspileContext
): string {
  const kind = stmt.getKind();

  switch (kind) {
    case SyntaxKind.VariableStatement:
      return transpileVariableStatement(stmt as VariableStatement, mappings, indent, context);

    case SyntaxKind.IfStatement:
      return transpileIfStatement(stmt as IfStatement, mappings, indent);

    case SyntaxKind.ForStatement:
      return transpileForStatement(stmt as ForStatement, mappings, indent);

    case SyntaxKind.ForOfStatement:
      return transpileForOfStatement(stmt as ForOfStatement, mappings, indent);

    case SyntaxKind.ForInStatement:
      return transpileForInStatement(stmt as ForInStatement, mappings, indent);

    case SyntaxKind.WhileStatement:
      return transpileWhileStatement(stmt as WhileStatement, mappings, indent);

    case SyntaxKind.DoStatement:
      return transpileDoStatement(stmt as DoStatement, mappings, indent);

    case SyntaxKind.ReturnStatement:
      return transpileReturnStatement(stmt as ReturnStatement, mappings, indent);

    case SyntaxKind.ExpressionStatement:
      return transpileExpressionStatement(stmt as ExpressionStatement, mappings, indent);

    case SyntaxKind.Block:
      return transpileBlock(stmt as Block, mappings, indent);

    case SyntaxKind.BreakStatement:
      return `${indent}break;`;

    case SyntaxKind.ContinueStatement:
      return `${indent}continue;`;

    case SyntaxKind.ThrowStatement:
      const throwExpr = (stmt as any).getExpression();
      return `${indent}throw ${transpileExpression(throwExpr, mappings, indent)};`;

    case SyntaxKind.TryStatement:
      return transpileTryStatement(stmt as any, mappings, indent);

    default:
      // Return raw text with basic transformations for unhandled cases
      return `${indent}${applyBasicTransformations(stmt.getText())}`;
  }
}

/**
 * Transpile variable statement (let, const, var)
 */
function transpileVariableStatement(
  stmt: VariableStatement,
  mappings: ResolvedTypeMappings,
  indent: string,
  context?: TranspileContext
): string {
  const declarations = stmt.getDeclarationList();
  const decls = declarations.getDeclarations();

  const results: string[] = [];

  for (const decl of decls) {
    const rawName = decl.getName();
    const name = escapeCSharpKeyword(rawName);
    const typeNode = decl.getTypeNode();
    const initializer = decl.getInitializer();

    let csType: string;
    let initText: string | undefined;

    if (typeNode) {
      csType = transformType(typeNode, mappings);
    } else if (initializer) {
      // Check if the initializer is an arrow function - need explicit type for C#
      if (initializer.getKind() === SyntaxKind.ArrowFunction) {
        const arrowFunc = initializer as ArrowFunction;
        csType = inferArrowFunctionType(arrowFunc, mappings);
        // Add warning for arrow function without explicit type
        if (context) {
          addInferenceWarning(context, "variable", rawName, csType, decl.getStartLineNumber());
        }
      } else {
        // Use 'var' for type inference when initializer is present
        csType = "var";
      }
    } else {
      // No type, no initializer - default to object
      csType = "object";
    }

    if (initializer) {
      initText = transpileExpression(initializer, mappings, indent);
    }

    // C# doesn't have let/const - both become var or explicit type
    // const in C# requires compile-time constant, so we use var
    if (initText) {
      results.push(`${indent}${csType} ${name} = ${initText};`);
    } else {
      results.push(`${indent}${csType} ${name};`);
    }
  }

  return results.join("\n");
}

/**
 * Infer the C# delegate type (Action or Func) for an arrow function
 */
function inferArrowFunctionType(arrowFunc: ArrowFunction, mappings: ResolvedTypeMappings): string {
  const params = arrowFunc.getParameters();
  const returnType = arrowFunc.getReturnType();

  // Get parameter types
  const paramTypes: string[] = [];
  for (const param of params) {
    const paramTypeNode = param.getTypeNode();
    if (paramTypeNode) {
      paramTypes.push(transformType(paramTypeNode, mappings));
    } else {
      // Try to infer the parameter type
      const inferredType = param.getType();
      paramTypes.push(transformResolvedType(inferredType, mappings));
    }
  }

  // Get return type
  const returnCSharp = transformResolvedType(returnType, mappings);

  // Build Func or Action type
  if (returnCSharp === "void") {
    if (paramTypes.length === 0) {
      return "Action";
    }
    return `Action<${paramTypes.join(", ")}>`;
  } else {
    if (paramTypes.length === 0) {
      return `Func<${returnCSharp}>`;
    }
    return `Func<${paramTypes.join(", ")}, ${returnCSharp}>`;
  }
}

/**
 * Transpile if statement
 */
function transpileIfStatement(stmt: IfStatement, mappings: ResolvedTypeMappings, indent: string): string {
  const condition = transpileExpression(stmt.getExpression(), mappings, indent);
  const thenStmt = stmt.getThenStatement();
  const elseStmt = stmt.getElseStatement();

  let result = `${indent}if (${condition})`;

  if (thenStmt.getKind() === SyntaxKind.Block) {
    result += "\n" + transpileBlock(thenStmt as Block, mappings, indent);
  } else {
    result += "\n" + transpileStatement(thenStmt, mappings, indent + "    ");
  }

  if (elseStmt) {
    result += `\n${indent}else`;
    if (elseStmt.getKind() === SyntaxKind.Block) {
      result += "\n" + transpileBlock(elseStmt as Block, mappings, indent);
    } else if (elseStmt.getKind() === SyntaxKind.IfStatement) {
      // else if
      result += " " + transpileIfStatement(elseStmt as IfStatement, mappings, indent).trimStart();
    } else {
      result += "\n" + transpileStatement(elseStmt, mappings, indent + "    ");
    }
  }

  return result;
}

/**
 * Transpile for statement
 */
function transpileForStatement(stmt: ForStatement, mappings: ResolvedTypeMappings, indent: string): string {
  const initializer = stmt.getInitializer();
  const condition = stmt.getCondition();
  const incrementor = stmt.getIncrementor();
  const body = stmt.getStatement();

  let initText = "";
  if (initializer) {
    if (initializer.getKind() === SyntaxKind.VariableDeclarationList) {
      // Handle: for (let i = 0; ...)
      const declList = initializer as any;
      const decls = declList.getDeclarations();
      const parts: string[] = [];
      for (const decl of decls) {
        const name = escapeCSharpKeyword(decl.getName());
        const init = decl.getInitializer();
        if (init) {
          parts.push(`var ${name} = ${transpileExpression(init, mappings, indent)}`);
        } else {
          parts.push(`var ${name}`);
        }
      }
      initText = parts.join(", ");
    } else {
      initText = transpileExpression(initializer as Expression, mappings, indent);
    }
  }

  const condText = condition ? transpileExpression(condition, mappings, indent) : "";
  const incrText = incrementor ? transpileExpression(incrementor, mappings, indent) : "";

  let result = `${indent}for (${initText}; ${condText}; ${incrText})`;

  if (body.getKind() === SyntaxKind.Block) {
    result += "\n" + transpileBlock(body as Block, mappings, indent);
  } else {
    result += "\n" + transpileStatement(body, mappings, indent + "    ");
  }

  return result;
}

/**
 * Transpile for-of statement (TypeScript) to foreach (C#)
 */
function transpileForOfStatement(stmt: ForOfStatement, mappings: ResolvedTypeMappings, indent: string): string {
  const initializer = stmt.getInitializer();
  const expression = stmt.getExpression();
  const body = stmt.getStatement();

  // Get variable name from initializer
  let varName = "item";
  if (initializer.getKind() === SyntaxKind.VariableDeclarationList) {
    const declList = initializer as any;
    const decls = declList.getDeclarations();
    if (decls.length > 0) {
      varName = escapeCSharpKeyword(decls[0].getName());
    }
  }

  const iterableText = transpileExpression(expression, mappings, indent);

  let result = `${indent}foreach (var ${varName} in ${iterableText})`;

  if (body.getKind() === SyntaxKind.Block) {
    result += "\n" + transpileBlock(body as Block, mappings, indent);
  } else {
    result += "\n" + transpileStatement(body, mappings, indent + "    ");
  }

  return result;
}

/**
 * Transpile for-in statement (TypeScript) to foreach with keys (C#)
 */
function transpileForInStatement(stmt: ForInStatement, mappings: ResolvedTypeMappings, indent: string): string {
  const initializer = stmt.getInitializer();
  const expression = stmt.getExpression();
  const body = stmt.getStatement();

  // Get variable name from initializer
  let varName = "key";
  if (initializer.getKind() === SyntaxKind.VariableDeclarationList) {
    const declList = initializer as any;
    const decls = declList.getDeclarations();
    if (decls.length > 0) {
      varName = escapeCSharpKeyword(decls[0].getName());
    }
  }

  const iterableText = transpileExpression(expression, mappings, indent);

  // For-in iterates over keys - in C#, use .Keys for dictionaries
  let result = `${indent}foreach (var ${varName} in ${iterableText}.Keys)`;

  if (body.getKind() === SyntaxKind.Block) {
    result += "\n" + transpileBlock(body as Block, mappings, indent);
  } else {
    result += "\n" + transpileStatement(body, mappings, indent + "    ");
  }

  return result;
}

/**
 * Transpile while statement
 */
function transpileWhileStatement(stmt: WhileStatement, mappings: ResolvedTypeMappings, indent: string): string {
  const condition = transpileExpression(stmt.getExpression(), mappings, indent);
  const body = stmt.getStatement();

  let result = `${indent}while (${condition})`;

  if (body.getKind() === SyntaxKind.Block) {
    result += "\n" + transpileBlock(body as Block, mappings, indent);
  } else {
    result += "\n" + transpileStatement(body, mappings, indent + "    ");
  }

  return result;
}

/**
 * Transpile do-while statement
 */
function transpileDoStatement(stmt: DoStatement, mappings: ResolvedTypeMappings, indent: string): string {
  const condition = transpileExpression(stmt.getExpression(), mappings, indent);
  const body = stmt.getStatement();

  let result = `${indent}do`;

  if (body.getKind() === SyntaxKind.Block) {
    result += "\n" + transpileBlock(body as Block, mappings, indent);
  } else {
    result += "\n" + transpileStatement(body, mappings, indent + "    ");
  }

  result += ` while (${condition});`;

  return result;
}

/**
 * Transpile return statement
 */
function transpileReturnStatement(stmt: ReturnStatement, mappings: ResolvedTypeMappings, indent: string): string {
  const expr = stmt.getExpression();
  if (expr) {
    return `${indent}return ${transpileExpression(expr, mappings, indent)};`;
  }
  return `${indent}return;`;
}

/**
 * Transpile expression statement
 */
function transpileExpressionStatement(
  stmt: ExpressionStatement,
  mappings: ResolvedTypeMappings,
  indent: string
): string {
  const expr = stmt.getExpression();
  return `${indent}${transpileExpression(expr, mappings, indent)};`;
}

/**
 * Transpile block
 */
function transpileBlock(block: Block, mappings: ResolvedTypeMappings, indent: string): string {
  const statements = block.getStatements();
  const innerIndent = indent + "    ";

  const lines: string[] = [];
  lines.push(`${indent}{`);

  for (const stmt of statements) {
    lines.push(transpileStatement(stmt, mappings, innerIndent));
  }

  lines.push(`${indent}}`);

  return lines.join("\n");
}

/**
 * Transpile try-catch-finally statement
 */
function transpileTryStatement(stmt: any, mappings: ResolvedTypeMappings, indent: string): string {
  const tryBlock = stmt.getTryBlock();
  const catchClause = stmt.getCatchClause();
  const finallyBlock = stmt.getFinallyBlock();

  let result = `${indent}try\n${transpileBlock(tryBlock, mappings, indent)}`;

  if (catchClause) {
    const varDecl = catchClause.getVariableDeclaration();
    const varName = varDecl ? escapeCSharpKeyword(varDecl.getName()) : "ex";
    result += `\n${indent}catch (Exception ${varName})\n${transpileBlock(catchClause.getBlock(), mappings, indent)}`;
  }

  if (finallyBlock) {
    result += `\n${indent}finally\n${transpileBlock(finallyBlock, mappings, indent)}`;
  }

  return result;
}

/**
 * Apply basic transformations for unhandled statements
 */
function applyBasicTransformations(text: string): string {
  let result = text;

  // console.log -> GD.Print
  result = result.replace(/console\.log\(/g, "GD.Print(");
  result = result.replace(/console\.error\(/g, "GD.PrintErr(");

  // === to ==
  result = result.replace(/===/g, "==");
  result = result.replace(/!==/g, "!=");

  return result;
}

/**
 * Transpile multiple statements (e.g., method body)
 */
export function transpileStatements(
  statements: Statement[],
  mappings: ResolvedTypeMappings,
  indent = "    ",
  context?: TranspileContext
): string {
  return statements.map((stmt) => transpileStatement(stmt, mappings, indent, context)).join("\n");
}
