import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "5173", 10),
    strictPort: false,
  },

  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "4173", 10),
    strictPort: false,
  },

  build: {
    sourcemap: false,
    minify: "esbuild",
  },
});
