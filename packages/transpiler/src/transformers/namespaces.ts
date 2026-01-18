/**
 * Namespace transformation utilities
 */

import { SourceFile } from 'ts-morph';
import { TranspilerConfig, getNamespace } from '../config/schema.js';
import { pathToNamespace } from '../utils/naming.js';

/**
 * Generate the C# namespace for a source file
 */
export function generateNamespace(
  sourceFile: SourceFile,
  config: TranspilerConfig
): string {
  const rootNamespace = getNamespace(config);
  const filePath = sourceFile.getFilePath();
  
  // Get relative path from input directory
  const relativePath = getRelativePath(filePath, config.inputDir);
  
  // Convert path to namespace segments
  const pathNamespace = pathToNamespace(relativePath);
  
  if (!pathNamespace) {
    return rootNamespace;
  }
  
  return `${rootNamespace}.${pathNamespace}`;
}

/**
 * Generate namespace declaration for a C# file
 */
export function generateNamespaceDeclaration(
  sourceFile: SourceFile,
  config: TranspilerConfig
): string {
  const namespace = generateNamespace(sourceFile, config);
  
  // Use file-scoped namespace (C# 10+)
  return `namespace ${namespace};`;
}

/**
 * Get relative path from base directory
 */
function getRelativePath(filePath: string, baseDir: string): string {
  // Normalize paths
  const normalizedFile = filePath.replace(/\\/g, '/');
  const normalizedBase = baseDir.replace(/\\/g, '/').replace(/^\.\//, '');
  
  // Find the base directory in the file path
  const baseIndex = normalizedFile.indexOf(normalizedBase);
  
  if (baseIndex === -1) {
    // Base not found, return just the filename
    const parts = normalizedFile.split('/');
    return parts[parts.length - 1] ?? '';
  }
  
  // Get path after base directory
  const afterBase = normalizedFile.slice(baseIndex + normalizedBase.length);
  return afterBase.replace(/^\//, '');
}

/**
 * Determine if a namespace declaration should be included
 * (only if there are classes/types to put in it)
 */
export function shouldIncludeNamespace(sourceFile: SourceFile): boolean {
  const classes = sourceFile.getClasses();
  const interfaces = sourceFile.getInterfaces();
  const typeAliases = sourceFile.getTypeAliases();
  const enums = sourceFile.getEnums();
  
  return classes.length > 0 || 
         interfaces.length > 0 || 
         typeAliases.length > 0 ||
         enums.length > 0;
}

