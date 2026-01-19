import { fail } from "@sveltejs/kit";
import { decodeCode } from "$lib/share";
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

const defaultTranspiled = transpileCode(DEFAULT_CODE);

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
};

/**
 * Transpile TypeScript code to C#
 */
function transpileCode(input: string): TranspileResultData {
  const result = transpileSourceWithWarnings(input);

  return {
    input,
    output: result.code,
    warnings: result.warnings,
    error: null
  };
}

export const load: PageServerLoad = async ({ params }) => {
  // Check for shared code in URL params or route param
  const { share_code } = params;

  // Transpile the initial code
  let vm: TranspileResultData | undefined = undefined;
  if (typeof share_code !== "undefined") {
    const decoded = decodeCode(share_code);
    if (decoded) {
      try {
        vm = transpileCode(decoded);
      } catch (err) {
        vm = {
          input: "// Invalid share code",
          output: "",
          warnings: [],
          error: err instanceof Error ? err.message : String(err)
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
    tsInput: vm.input,
    csOutput: vm.output,
    warnings: vm.warnings,
    error: vm.error
  };
};

export const actions = {
  transpile: async ({ request }) => {
    const formData = await request.formData();
    const tsInput = formData.get("tsInput");

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

    try {
      const result = transpileCode(tsInput);

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
