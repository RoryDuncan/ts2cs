/**
 * Import transformation utilities
 */

import { SourceFile, ImportDeclaration } from "ts-morph";
import { TranspilerConfig, getNamespace } from "../config/schema.js";
import { isGodotClass } from "../godot/index.js";
import { pathToNamespace } from "../utils/naming.js";

/**
 * Collected using statements for a C# file
 */
export interface UsingStatements {
  /** Standard using statements */
  usings: Set<string>;
  /** Type alias using statements (using Alias = Namespace.Type;) */
  typeAliases: Map<string, string>;
  /** Whether Godot namespace is needed */
  needsGodot: boolean;
  /** Warnings for unsupported import patterns */
  warnings: string[];
  /** Map of imported type names to their derived namespace (only for subdirectory imports) */
  importedTypes: Map<string, string>;
}

/**
 * Analyze imports and determine required using statements
 */
export function analyzeImports(sourceFile: SourceFile, config: TranspilerConfig): UsingStatements {
  const result: UsingStatements = {
    usings: new Set(),
    typeAliases: new Map(),
    needsGodot: false,
    warnings: [],
    importedTypes: new Map()
  };

  const imports = sourceFile.getImportDeclarations();

  for (const importDecl of imports) {
    analyzeImportDeclaration(importDecl, config, result);
  }

  // Also check for Godot class usage in extends clauses
  const classes = sourceFile.getClasses();
  for (const cls of classes) {
    const baseClass = cls.getExtends();
    if (baseClass) {
      const baseName = baseClass.getExpression().getText();
      if (isGodotClass(baseName)) {
        result.needsGodot = true;
      }
    }
  }

  return result;
}

/**
 * Check if an import path has subdirectories (e.g., ./config/colors.ts vs ./player.ts)
 */
function hasSubdirectory(importPath: string): boolean {
  // Remove leading ./ or ../
  const cleanPath = importPath.replace(/^\.\.?\//, "");
  // Check if there's at least one directory separator before the filename
  return cleanPath.includes("/");
}

/**
 * Clean an import path for namespace derivation
 * - Removes leading ./ or ../
 * - Removes file extension
 * - Returns only the directory parts
 */
function cleanImportPath(importPath: string): string {
  // Remove leading ./ or ../
  let cleanPath = importPath.replace(/^\.\.?\//, "");
  // Remove file extension if present
  cleanPath = cleanPath.replace(/\.(ts|tsx|js|jsx)$/, "");
  // Add extension back for pathToNamespace to strip the filename
  return cleanPath + ".ts";
}

/**
 * Analyze a single import declaration
 */
function analyzeImportDeclaration(
  importDecl: ImportDeclaration,
  _config: TranspilerConfig,
  result: UsingStatements
): void {
  const moduleSpecifier = importDecl.getModuleSpecifierValue();

  // Check for side-effect only import (import './something')
  const namedImports = importDecl.getNamedImports();
  const defaultImport = importDecl.getDefaultImport();
  const namespaceImport = importDecl.getNamespaceImport();

  if (!namedImports.length && !defaultImport && !namespaceImport) {
    // Skip type-only imports that have no bindings (shouldn't happen but be safe)
    if (!importDecl.isTypeOnly()) {
      result.warnings.push(`Side-effect import '${moduleSpecifier}' skipped (no C# equivalent)`);
    }
    return;
  }

  // Handle Godot imports
  if (moduleSpecifier === "godot" || moduleSpecifier === "@godot") {
    result.needsGodot = true;

    // Check for aliased imports from Godot
    for (const namedImport of namedImports) {
      const name = namedImport.getName();
      const alias = namedImport.getAliasNode()?.getText();

      if (alias && alias !== name) {
        // Generate type alias: using Vec2 = Godot.Vector2;
        result.typeAliases.set(alias, `Godot.${name}`);
      }
    }
    return;
  }

  // Handle relative imports - track types from subdirectories for inline qualification
  if (moduleSpecifier.startsWith("./") || moduleSpecifier.startsWith("../")) {
    // Check for default imports which are not directly supported
    if (defaultImport) {
      result.warnings.push(
        `Default import '${defaultImport.getText()}' from '${moduleSpecifier}' not supported - use named exports instead`
      );
    }

    // Only track types from subdirectory imports (not root-level files)
    if (hasSubdirectory(moduleSpecifier)) {
      // Derive namespace from the import path (clean it first)
      const cleanedPath = cleanImportPath(moduleSpecifier);
      const namespace = pathToNamespace(cleanedPath);

      if (namespace) {
        // Track each imported type with its namespace
        for (const namedImport of namedImports) {
          // Use the alias if present, otherwise the original name
          const localName = namedImport.getAliasNode()?.getText() ?? namedImport.getName();
          result.importedTypes.set(localName, namespace);
        }
      }
    }
    return;
  }

  // Handle package imports (node_modules style)
  // Warn about unsupported external packages
  result.warnings.push(`External import '${moduleSpecifier}' not supported - may need manual conversion`);
}

/**
 * Convert a relative import path to a C# namespace for inline qualification
 * Used when types need to be fully qualified in the generated C# code
 */
export function convertImportToNamespace(importPath: string, config: TranspilerConfig): string | null {
  const rootNamespace = getNamespace(config);

  // Remove leading ./ or ../
  let cleanPath = importPath.replace(/^\.\//, "").replace(/^\.\.\//, "");

  // Remove file extension if present
  cleanPath = cleanPath.replace(/\.(ts|tsx|js|jsx)$/, "");

  // Convert path to namespace
  const pathNs = pathToNamespace(cleanPath + ".ts"); // Add extension for path parsing

  if (!pathNs) {
    return rootNamespace;
  }

  return `${rootNamespace}.${pathNs}`;
}

/**
 * Generate using statements for a C# file
 */
export function generateUsingStatements(usings: UsingStatements): string[] {
  const statements: string[] = [];

  // System usings first (if any)
  // For now, we don't add system usings automatically

  // Godot using
  if (usings.needsGodot) {
    statements.push("using Godot;");
  }

  // Other usings
  const sortedUsings = Array.from(usings.usings).sort();
  for (const ns of sortedUsings) {
    statements.push(`using ${ns};`);
  }

  // Type aliases (using Alias = Namespace.Type;)
  const sortedAliases = Array.from(usings.typeAliases.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [alias, fullType] of sortedAliases) {
    statements.push(`using ${alias} = ${fullType};`);
  }

  return statements;
}
