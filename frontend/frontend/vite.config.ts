import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@/domain": path.resolve(dirname, "./src/domain"),
      "@/application": path.resolve(dirname, "./src/application"),
      "@/infrastructure": path.resolve(dirname, "./src/infrastructure"),
      "@/presentation": path.resolve(dirname, "./src/presentation"),
      "@/shared": path.resolve(dirname, "./src/shared"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: "es2023",
    sourcemap: false,
    outDir: "dist",
  },
});
