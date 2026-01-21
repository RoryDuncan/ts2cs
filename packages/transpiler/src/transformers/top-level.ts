/**
 * Top-level statement transformation utilities
 *
 * Handles transpilation of top-level TypeScript code (variables, constants,
 * expression statements) into C# static module classes.
 */

import {
  SourceFile,
  Statement,
  SyntaxKind,
  VariableStatement,
  ExpressionStatement,
  VariableDeclaration,
  VariableDeclarationKind
} from "ts-morph";
import { TranspilerConfig, TopLevelStrategy } from "../config/schema.js";
import { TranspileContext, TranspileWarning } from "../transpiler.js";
import { transformType } from "./types.js";
import { transpileExpression } from "./expressions.js";
import { escapeCSharpKeyword, toPascalCase } from "../utils/naming.js";

/**
 * Categorized top-level statement
 */
export interface TopLevelConstant {
  name: string;
  type: string;
  value: string;
  isLiteral: boolean;
  line?: number;
}

export interface TopLevelVariable {
  name: string;
  type: string;
  initializer?: string;
  line?: number;
}

export interface TopLevelExpression {
  code: string;
  line?: number;
}

/**
 * Collected top-level statements from a source file
 */
export interface CollectedTopLevel {
  constants: TopLevelConstant[];
  variables: TopLevelVariable[];
  expressions: TopLevelExpression[];
  warnings: TranspileWarning[];
}

/**
 * Check if an expression is a compile-time literal (can be C# const)
 */
export function isLiteralExpression(expr: Statement | undefined): boolean {
  if (!expr) return false;

  const kind = expr.getKind();
  return (
    kind === SyntaxKind.NumericLiteral ||
    kind === SyntaxKind.StringLiteral ||
    kind === SyntaxKind.TrueKeyword ||
    kind === SyntaxKind.FalseKeyword ||
    kind === SyntaxKind.NullKeyword
  );
}

/**
 * Check if a variable declaration initializer is a literal
 */
function isInitializerLiteral(decl: VariableDeclaration): boolean {
  const initializer = decl.getInitializer();
  if (!initializer) return false;

  const kind = initializer.getKind();
  
  // Simple literals
  if (
    kind === SyntaxKind.NumericLiteral ||
    kind === SyntaxKind.StringLiteral ||
    kind === SyntaxKind.TrueKeyword ||
    kind === SyntaxKind.FalseKeyword ||
    kind === SyntaxKind.NullKeyword
  ) {
    return true;
  }
  
  // Handle negative numbers like -1 (PrefixUnaryExpression with minus operator)
  if (kind === SyntaxKind.PrefixUnaryExpression) {
    const children = initializer.getChildren();
    // Check for minus sign followed by numeric literal
    if (children.length >= 2) {
      const operator = children[0];
      const operand = children[1];
      if (
        operator?.getKind() === SyntaxKind.MinusToken &&
        operand?.getKind() === SyntaxKind.NumericLiteral
      ) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Collect and categorize top-level statements from a source file
 */
export function collectTopLevelStatements(
  sourceFile: SourceFile,
  context: TranspileContext
): CollectedTopLevel {
  const result: CollectedTopLevel = {
    constants: [],
    variables: [],
    expressions: [],
    warnings: []
  };

  const statements = sourceFile.getStatements();

  for (const stmt of statements) {
    const kind = stmt.getKind();

    // Skip declarations that are handled elsewhere
    if (
      kind === SyntaxKind.ClassDeclaration ||
      kind === SyntaxKind.FunctionDeclaration ||
      kind === SyntaxKind.InterfaceDeclaration ||
      kind === SyntaxKind.EnumDeclaration ||
      kind === SyntaxKind.TypeAliasDeclaration ||
      kind === SyntaxKind.ImportDeclaration ||
      kind === SyntaxKind.ExportDeclaration ||
      kind === SyntaxKind.ExportAssignment ||
      kind === SyntaxKind.ModuleDeclaration
    ) {
      continue;
    }

    // Handle variable statements (const, let, var)
    if (kind === SyntaxKind.VariableStatement) {
      processVariableStatement(stmt as VariableStatement, context, result);
      continue;
    }

    // Handle expression statements
    if (kind === SyntaxKind.ExpressionStatement) {
      processExpressionStatement(stmt as ExpressionStatement, context, result);
      continue;
    }

    // Check for top-level await
    if (kind === SyntaxKind.ExpressionStatement) {
      const exprStmt = stmt as ExpressionStatement;
      const expr = exprStmt.getExpression();
      if (expr.getKind() === SyntaxKind.AwaitExpression) {
        result.warnings.push({
          message: "Top-level await is not supported in C# static context. Move to an async method.",
          line: stmt.getStartLineNumber()
        });
        continue;
      }
    }

    // Other statements - add warning
    result.warnings.push({
      message: `Unsupported top-level statement: ${SyntaxKind[kind]}`,
      line: stmt.getStartLineNumber()
    });
  }

  return result;
}

/**
 * Process a variable statement (const/let/var)
 */
function processVariableStatement(
  stmt: VariableStatement,
  context: TranspileContext,
  result: CollectedTopLevel
): void {
  const declarations = stmt.getDeclarationList();
  const declKind = declarations.getDeclarationKind();
  const isConst = declKind === VariableDeclarationKind.Const;
  const decls = declarations.getDeclarations();

  for (const decl of decls) {
    const rawName = decl.getName();
    const name = escapeCSharpKeyword(rawName);
    const typeNode = decl.getTypeNode();
    const initializer = decl.getInitializer();
    const line = decl.getStartLineNumber();

    // Determine the C# type
    let csType: string;
    if (typeNode) {
      csType = transformType(typeNode, context.mappings);
    } else if (initializer) {
      // Infer type from initializer's kind
      const initKind = initializer.getKind();
      if (initKind === SyntaxKind.NumericLiteral) {
        csType = context.mappings.number;
      } else if (initKind === SyntaxKind.StringLiteral) {
        csType = "string";
      } else if (initKind === SyntaxKind.TrueKeyword || initKind === SyntaxKind.FalseKeyword) {
        csType = "bool";
      } else if (initKind === SyntaxKind.NullKeyword) {
        csType = "object";
      } else if (initKind === SyntaxKind.PrefixUnaryExpression) {
        // Check if it's a negative number
        const operand = initializer.getChildAtIndex(1);
        if (operand?.getKind() === SyntaxKind.NumericLiteral) {
          csType = context.mappings.number;
        } else {
          csType = "var";
        }
      } else {
        // For complex expressions, try to infer from the type
        const inferredType = decl.getType();
        const baseType = inferredType.getBaseTypeOfLiteralType();
        const baseText = baseType.getText();
        if (baseText === "number") {
          csType = context.mappings.number;
        } else if (baseText === "string") {
          csType = "string";
        } else if (baseText === "boolean") {
          csType = "bool";
        } else {
          csType = "var";
        }
      }
    } else {
      csType = "object";
    }

    if (isConst) {
      const isLiteral = isInitializerLiteral(decl);
      const value = initializer
        ? transpileExpression(initializer, context.mappings)
        : "";

      result.constants.push({
        name,
        type: csType,
        value,
        isLiteral,
        line
      });
    } else {
      // let or var - becomes static field
      const initValue = initializer
        ? transpileExpression(initializer, context.mappings)
        : undefined;

      result.variables.push({
        name,
        type: csType,
        initializer: initValue,
        line
      });
    }
  }
}

/**
 * Process an expression statement
 */
function processExpressionStatement(
  stmt: ExpressionStatement,
  context: TranspileContext,
  result: CollectedTopLevel
): void {
  const expr = stmt.getExpression();
  
  // Check for await expression
  if (expr.getKind() === SyntaxKind.AwaitExpression) {
    result.warnings.push({
      message: "Top-level await is not supported in C# static context. Move to an async method.",
      line: stmt.getStartLineNumber()
    });
    return;
  }

  const code = transpileExpression(expr, context.mappings);
  result.expressions.push({
    code,
    line: stmt.getStartLineNumber()
  });
}

/**
 * Generate the module class name from file path
 */
export function getModuleClassName(filePath: string, existingClassNames: Set<string>): string {
  // Extract base name from file path
  const baseName = filePath
    .replace(/\.[^/.]+$/, "") // Remove extension
    .split(/[/\\]/)
    .pop() ?? "Global";

  // Capitalize first letter
  const pascalName = toPascalCase(baseName);

  // Try {Name}Module first
  let className = `${pascalName}Module`;

  // Check for naming conflict
  if (existingClassNames.has(className) || baseName.toLowerCase() === "module") {
    // Use {Name}Globals as fallback
    className = `${pascalName}Globals`;
  }

  return className;
}

/**
 * Generate the static module class code
 */
export function generateModuleClass(
  className: string,
  collected: CollectedTopLevel,
  context: TranspileContext,
  indent = "    "
): string {
  const strategy = context.config.topLevelStrategy ?? "lazy";
  const lines: string[] = [];

  lines.push(`public static class ${className}`);
  lines.push("{");

  // Generate constants
  for (const constant of collected.constants) {
    if (constant.isLiteral) {
      // Use C# const for literals
      lines.push(`${indent}public const ${constant.type} ${constant.name} = ${constant.value};`);
    } else {
      // Use static readonly for non-literals (initialized in static ctor or Init)
      lines.push(`${indent}public static readonly ${constant.type} ${constant.name};`);
    }
  }

  // Generate variables (static fields)
  for (const variable of collected.variables) {
    if (variable.initializer) {
      lines.push(`${indent}public static ${variable.type} ${variable.name} = ${variable.initializer};`);
    } else {
      lines.push(`${indent}public static ${variable.type} ${variable.name};`);
    }
  }

  // Add blank line before init logic if we have fields
  if (collected.constants.length > 0 || collected.variables.length > 0) {
    lines.push("");
  }

  // Generate initialization based on strategy
  const initStatements = generateInitStatements(collected, context, indent + "    ");

  if (initStatements.length > 0 || hasNonLiteralConstants(collected)) {
    if (strategy === "lazy") {
      // Static constructor
      lines.push(`${indent}static ${className}()`);
      lines.push(`${indent}{`);
      
      // Initialize non-literal constants
      for (const constant of collected.constants) {
        if (!constant.isLiteral) {
          lines.push(`${indent}    ${constant.name} = ${constant.value};`);
        }
      }
      
      // Add expression statements
      for (const stmt of initStatements) {
        lines.push(stmt);
      }
      
      lines.push(`${indent}}`);
    } else {
      // 'autoload' or 'manual' - use Init() method
      lines.push(`${indent}public static void Init()`);
      lines.push(`${indent}{`);
      
      // Initialize non-literal constants
      for (const constant of collected.constants) {
        if (!constant.isLiteral) {
          lines.push(`${indent}    ${constant.name} = ${constant.value};`);
        }
      }
      
      // Add expression statements
      for (const stmt of initStatements) {
        lines.push(stmt);
      }
      
      lines.push(`${indent}}`);
    }
  }

  lines.push("}");

  return lines.join("\n");
}

/**
 * Check if there are any non-literal constants that need initialization
 */
function hasNonLiteralConstants(collected: CollectedTopLevel): boolean {
  return collected.constants.some((c) => !c.isLiteral);
}

/**
 * Generate the initialization statements
 */
function generateInitStatements(
  collected: CollectedTopLevel,
  _context: TranspileContext,
  indent: string
): string[] {
  const statements: string[] = [];

  for (const expr of collected.expressions) {
    statements.push(`${indent}${expr.code};`);
  }

  return statements;
}

/**
 * Generate the autoload node class
 */
export function generateAutoloadClass(
  moduleClassName: string,
  filePath: string,
  indent = "    "
): string {
  const autoloadClassName = `${moduleClassName}Autoload`;
  const lines: string[] = [];

  lines.push("using Godot;");
  lines.push("");
  lines.push("/// <summary>");
  lines.push(`/// Autoload initializer for ${moduleClassName}.`);
  lines.push("/// Add to project.godot under [autoload]:");
  lines.push(`/// ${moduleClassName}=\"*res://${filePath.replace(/\.ts$/, ".cs")}\"`);
  lines.push("/// </summary>");
  lines.push(`public partial class ${autoloadClassName} : Node`);
  lines.push("{");
  lines.push(`${indent}public override void _Ready()`);
  lines.push(`${indent}{`);
  lines.push(`${indent}    ${moduleClassName}.Init();`);
  lines.push(`${indent}}`);
  lines.push("}");

  return lines.join("\n");
}

/**
 * Check if top-level generation should be skipped
 */
export function hasTopLevelStatements(collected: CollectedTopLevel): boolean {
  return (
    collected.constants.length > 0 ||
    collected.variables.length > 0 ||
    collected.expressions.length > 0
  );
}

