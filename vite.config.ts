import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: "VITE_",

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "5173", 10),
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      host: "localhost",
    },
  },

  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "4173", 10),
    strictPort: false,
  },
});
