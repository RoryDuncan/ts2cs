import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    // Don't re-bundle the transpiler - it's already a self-contained bundle
    external: ["ts2cs-transpiler"]
  }
});
