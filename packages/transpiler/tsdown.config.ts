import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli.ts"
  },
  // Use CJS format - ts-morph uses dynamic require() which doesn't work in ESM bundles
  format: ["cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  // Bundle all dependencies so consumers don't face ESM/CJS interop issues
  noExternal: ["ts-morph", "@ts-morph/common", "valibot", "cac"],
  // Shims for require/dirname in ESM contexts
  shims: true
});

