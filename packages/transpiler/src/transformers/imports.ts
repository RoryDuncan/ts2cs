/**
 * Import transformation utilities
 */

import { SourceFile, ImportDeclaration } from 'ts-morph';
import { TranspilerConfig, getNamespace } from '../config/schema.js';
import { isGodotClass } from '../godot/index.js';
import { pathToNamespace } from '../utils/naming.js';

/**
 * Collected using statements for a C# file
 */
export interface UsingStatements {
  /** Standard using statements */
  usings: Set<string>;
  /** Whether Godot namespace is needed */
  needsGodot: boolean;
}

/**
 * Analyze imports and determine required using statements
 */
export function analyzeImports(sourceFile: SourceFile, config: TranspilerConfig): UsingStatements {
  const result: UsingStatements = {
    usings: new Set(),
    needsGodot: false,
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
 * Analyze a single import declaration
 */
function analyzeImportDeclaration(
  importDecl: ImportDeclaration,
  config: TranspilerConfig,
  result: UsingStatements
): void {
  const moduleSpecifier = importDecl.getModuleSpecifierValue();
  
  // Handle Godot imports
  if (moduleSpecifier === 'godot' || moduleSpecifier === '@godot') {
    result.needsGodot = true;
    return;
  }
  
  // Handle relative imports
  if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
    // Convert to namespace
    const namespace = convertImportToNamespace(moduleSpecifier, config);
    if (namespace) {
      result.usings.add(namespace);
    }
    return;
  }
  
  // Handle package imports (node_modules style)
  // For now, we'll skip these or add them as-is
  // Could map common packages like 'lodash' to C# equivalents
}

/**
 * Convert a relative import path to a C# namespace
 */
function convertImportToNamespace(importPath: string, config: TranspilerConfig): string | null {
  const rootNamespace = getNamespace(config);
  
  // Remove leading ./ or ../
  let cleanPath = importPath
    .replace(/^\.\//, '')
    .replace(/^\.\.\//, '');
  
  // Remove file extension if present
  cleanPath = cleanPath.replace(/\.(ts|tsx|js|jsx)$/, '');
  
  // Convert path to namespace
  const pathNs = pathToNamespace(cleanPath + '.ts'); // Add extension for path parsing
  
  if (!pathNs) {
    return null;
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
    statements.push('using Godot;');
  }
  
  // Other usings
  const sortedUsings = Array.from(usings.usings).sort();
  for (const ns of sortedUsings) {
    statements.push(`using ${ns};`);
  }
  
  return statements;
}

