import { fail } from "@sveltejs/kit";
import { decodeShareData, DEFAULT_CONFIG, jsonToConfig, type ShareableConfig } from "$lib/share";
import { transpileSourceWithWarnings } from "ts2cs-transpiler";
import type { Actions, PageServerLoad } from "./$types";

// Maximum input size: 50KB
const MAX_INPUT_LENGTH = 50_000;

const DEFAULT_CODE = `class Player extends Node2D {
  health: number = 100;
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
  }

  get isAlive(): boolean {
    return this.health > 0;
  }
}`;

const defaultTranspiled = transpileCode(DEFAULT_CODE, DEFAULT_CONFIG);

type TranspileWarning = {
  message: string;
  line?: number;
  column?: number;
};

type TranspileResultData = {
  input: string;
  output: string;
  warnings: TranspileWarning[];
  error: string | null;
  config: ShareableConfig;
};

/**
 * Convert ShareableConfig to transpiler config format
 */
function toTranspilerConfig(config: ShareableConfig) {
  return {
    inputDir: ".",
    outputDir: ".",
    namespace: config.namespace,
    numberType: config.numberType,
    arrayTransform: config.arrayTransform,
    typedArrayTransform: config.typedArrayTransform,
    discriminatedUnionStrategy: config.discriminatedUnionStrategy,
    includeHeader: config.includeHeader
  };
}

/**
 * Transpile TypeScript code to C# with optional config
 */
function transpileCode(input: string, config: ShareableConfig): TranspileResultData {
  const transpilerConfig = toTranspilerConfig(config);
  const result = transpileSourceWithWarnings(input, "source.ts", transpilerConfig);

  return {
    input,
    output: result.code,
    warnings: result.warnings,
    error: null,
    config
  };
}

export const load: PageServerLoad = async ({ params }) => {
  // Check for shared code in URL params or route param
  const { share_code } = params;

  // Transpile the initial code
  let vm: TranspileResultData | undefined = undefined;
  if (typeof share_code !== "undefined") {
    const shareData = decodeShareData(share_code);
    if (shareData) {
      try {
        const config = { ...DEFAULT_CONFIG, ...shareData.config };
        vm = transpileCode(shareData.code, config);
      } catch (err) {
        vm = {
          input: "// Invalid share code",
          output: "",
          warnings: [],
          error: err instanceof Error ? err.message : String(err),
          config: DEFAULT_CONFIG
        };
      }
    }
  }

  if (vm === undefined) {
    vm = defaultTranspiled;
  }

  console.assert(vm !== undefined);

  return {
    defaultCode: DEFAULT_CODE,
    defaultConfig: DEFAULT_CONFIG,
    tsInput: vm.input,
    csOutput: vm.output,
    warnings: vm.warnings,
    error: vm.error,
    config: vm.config
  };
};

export const actions = {
  transpile: async ({ request }) => {
    const formData = await request.formData();
    const tsInput = formData.get("tsInput");
    const configJson = formData.get("config");

    // Validate input
    if (!tsInput || typeof tsInput !== "string") {
      return fail(400, { error: "No input provided", output: "", warnings: [] });
    }

    if (tsInput.length > MAX_INPUT_LENGTH) {
      return fail(400, {
        error: `Input too large. Maximum ${MAX_INPUT_LENGTH.toLocaleString()} characters allowed.`,
        output: "",
        warnings: []
      });
    }

    if (!tsInput.trim()) {
      return fail(400, { error: "Input is empty", output: "", warnings: [] });
    }

    // Parse config
    let config = DEFAULT_CONFIG;
    if (configJson && typeof configJson === "string") {
      const parsedConfig = jsonToConfig(configJson);
      if (parsedConfig === null) {
        return fail(400, {
          error: "Invalid configuration JSON. Please check the syntax.",
          output: "",
          warnings: []
        });
      }
      config = { ...DEFAULT_CONFIG, ...parsedConfig };
    }

    try {
      const result = transpileCode(tsInput, config);

      return {
        success: true,
        output: result.output,
        warnings: result.warnings,
        error: null
      };
    } catch (err) {
      return fail(500, {
        error: err instanceof Error ? err.message : String(err),
        output: "",
        warnings: []
      });
    }
  }
} satisfies Actions;
