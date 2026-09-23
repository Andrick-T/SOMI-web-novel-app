import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default defineConfig({
  ...viteConfig,
  test: {
    exclude: ["backend/dist-backend/**", "node_modules/**"],
  },
});
