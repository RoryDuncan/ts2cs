import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// Maximum input size: 50KB (50,000 characters)
const MAX_INPUT_LENGTH = 50_000;

export interface TranspileWarning {
  message: string;
  line?: number;
  column?: number;
}

export interface TranspileResponse {
  output: string;
  warnings: TranspileWarning[];
  error: string | null;
}

export const POST: RequestHandler = async ({ request }) => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload", output: "", warnings: [] }, { status: 400 });
  }

  const { tsInput } = body as { tsInput?: unknown };

  // Validate input exists and is a string
  if (!tsInput || typeof tsInput !== "string") {
    return json({ error: "No input provided", output: "", warnings: [] }, { status: 400 });
  }

  // Validate input size
  if (tsInput.length > MAX_INPUT_LENGTH) {
    return json(
      {
        error: `Input too large. Maximum ${MAX_INPUT_LENGTH.toLocaleString()} characters allowed, received ${tsInput.length.toLocaleString()}.`,
        output: "",
        warnings: []
      },
      { status: 400 }
    );
  }

  // Validate input is not empty after trimming
  if (!tsInput.trim()) {
    return json({ error: "Input is empty", output: "", warnings: [] }, { status: 400 });
  }

  try {
    // Dynamic import to avoid build-time bundling issues with ts-morph
    const { transpileSourceWithWarnings } = await import("ts2cs-transpiler/browser");

    // Transpile with warnings - no need to deal with ts-morph directly
    const result = transpileSourceWithWarnings(tsInput);

    const response: TranspileResponse = {
      output: result.code,
      warnings: result.warnings,
      error: null
    };

    return json(response);
  } catch (err) {
    return json(
      {
        error: err instanceof Error ? err.message : String(err),
        output: "",
        warnings: []
      },
      { status: 500 }
    );
  }
};
