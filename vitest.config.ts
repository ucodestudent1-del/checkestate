import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    exclude: ["src/__tests__/e2e/**"],
    environmentOptions: {
      node: {
        loadEnv: true,
      },
    },
    setupFiles: ["./src/__tests__/setup.ts"],
  },
});
