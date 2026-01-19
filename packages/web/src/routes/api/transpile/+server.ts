import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  const { tsInput } = await request.json();

  if (!tsInput || typeof tsInput !== "string") {
    return json({ error: "No input provided", output: "" }, { status: 400 });
  }

  try {
    // Dynamic import to avoid build-time bundling issues with ts-morph
    const { transpileSource } = await import("ts2cs-transpiler/browser");
    const output = transpileSource(tsInput);
    return json({ output, error: null });
  } catch (err) {
    return json(
      {
        error: err instanceof Error ? err.message : String(err),
        output: ""
      },
      { status: 500 }
    );
  }
};
