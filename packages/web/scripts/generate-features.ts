#!/usr/bin/env npx tsx
/**
 * Generate features.json from transpiler test files
 *
 * This script extracts test inputs from the transpiler tests and generates
 * share codes for the REPL, creating a features.json file for the /features page.
 *
 * Usage: npx tsx packages/web/scripts/generate-features.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import LZString from "lz-string";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ShareData {
  code: string;
  config?: Record<string, unknown>;
}

interface Feature {
  feature: string;
  repl: string;
  category: string;
}

interface FeaturesData {
  features: Feature[];
}

/**
 * Encode share data to URL-safe format (same as share.ts)
 */
function encodeShareData(data: ShareData): string {
  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Convert test description to human-readable feature name
 * "should transpile class with typed property" -> "Class with typed property"
 */
function cleanFeatureName(description: string): string {
  return description
    .replace(/^should\s+/i, "")
    .replace(/^transpile\s+/i, "")
    .replace(/^handle\s+/i, "")
    .replace(/^map\s+/i, "")
    .replace(/^convert\s+/i, "")
    .replace(/^support\s+/i, "")
    .replace(/^add\s+/i, "")
    .replace(/^preserve\s+/i, "")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Extract test cases from a test file
 * Returns array of { description, input, config? }
 */
function extractTestCases(
  content: string
): Array<{ description: string; input: string; config?: Record<string, unknown> }> {
  const results: Array<{ description: string; input: string; config?: Record<string, unknown> }> = [];

  // Match it("description", ...) or it('description', ...)
  // Then find the associated const input = `...`;
  const itBlockRegex = /it\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*(?:async\s*)?\(\s*\)\s*=>\s*\{([\s\S]*?)(?=\n\s*\}\s*\);|\n\s*it\s*\(|\n\s*describe\s*\(|\n\s*\}\s*\);?\s*$)/g;

  let match;
  while ((match = itBlockRegex.exec(content)) !== null) {
    const description = match[1];
    const body = match[2];

    // Skip tests that use .skip or don't have usable inputs
    if (description.includes("skip") || body.includes("it.skip")) {
      continue;
    }

    // Extract input from const input = `...`;
    const inputMatch = body.match(/const\s+input\s*=\s*`([\s\S]*?)`;/);
    if (!inputMatch) {
      continue;
    }

    const input = inputMatch[1];

    // Check for config in expectCSharp call
    let config: Record<string, unknown> | undefined;
    const configMatch = body.match(/expectCSharp\s*\(\s*input\s*,\s*expected\s*,\s*(\{[^}]+\})\s*\)/);
    if (configMatch) {
      try {
        // Parse the config object - it's JS object literal, not JSON
        // Simple extraction for known config keys
        const configStr = configMatch[1];
        config = {};
        const arrayTransformMatch = configStr.match(/arrayTransform:\s*["']([^"']+)["']/);
        if (arrayTransformMatch) {
          config.arrayTransform = arrayTransformMatch[1];
        }
        const typedArrayTransformMatch = configStr.match(/typedArrayTransform:\s*["']([^"']+)["']/);
        if (typedArrayTransformMatch) {
          config.typedArrayTransform = typedArrayTransformMatch[1];
        }
        const numberTypeMatch = configStr.match(/numberType:\s*["']([^"']+)["']/);
        if (numberTypeMatch) {
          config.numberType = numberTypeMatch[1];
        }
      } catch {
        // Ignore config parse errors
      }
    }

    results.push({ description, input, config });
  }

  return results;
}

/**
 * Get category name from file name
 */
function getCategoryFromFile(filename: string): string {
  const name = path.basename(filename, ".test.ts");
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Select representative features from each category
 * We don't need every test - just good examples
 */
function selectRepresentativeFeatures(
  tests: Array<{ description: string; input: string; config?: Record<string, unknown> }>,
  category: string
): Array<{ description: string; input: string; config?: Record<string, unknown> }> {
  // For most categories, take first 3-5 examples that are diverse
  // Skip very similar tests (like variations on the same theme)
  const seen = new Set<string>();
  const selected: typeof tests = [];

  for (const test of tests) {
    // Create a simplified key to detect duplicates
    const key = test.input.slice(0, 100);
    if (seen.has(key)) continue;
    seen.add(key);

    // Skip tests that are too simple or just testing edge cases
    if (test.description.toLowerCase().includes("warn")) continue;
    if (test.description.toLowerCase().includes("skip")) continue;
    if (test.description.toLowerCase().includes("empty")) continue;
    if (test.description.toLowerCase().includes("error")) continue;

    selected.push(test);

    // Limit per category
    if (selected.length >= 5) break;
  }

  return selected;
}

async function main() {
  const testsDir = path.resolve(__dirname, "../../transpiler/tests/ts-features");
  const outputPath = path.resolve(__dirname, "../src/routes/features/features.json");

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const testFiles = fs.readdirSync(testsDir).filter((f) => f.endsWith(".test.ts"));

  const allFeatures: Feature[] = [];

  for (const file of testFiles) {
    const filePath = path.join(testsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const category = getCategoryFromFile(file);

    console.log(`Processing ${file} (${category})...`);

    const tests = extractTestCases(content);
    const selected = selectRepresentativeFeatures(tests, category);

    console.log(`  Found ${tests.length} tests, selected ${selected.length}`);

    for (const test of selected) {
      const shareData: ShareData = { code: test.input };
      if (test.config && Object.keys(test.config).length > 0) {
        shareData.config = test.config;
      }

      const repl = encodeShareData(shareData);
      const feature = cleanFeatureName(test.description);

      allFeatures.push({
        feature,
        repl,
        category
      });
    }
  }

  const output: FeaturesData = { features: allFeatures };
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\nGenerated ${allFeatures.length} features to ${outputPath}`);
}

main().catch(console.error);

