import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  ...viteConfig,
  test: {
    setupFiles: [path.resolve(__dirname, "./vitest.setup.ts")],
    exclude: ["backend/dist-backend/**", "node_modules/**"],
  },
});
