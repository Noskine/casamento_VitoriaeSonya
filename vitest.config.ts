import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
    pool: "forks", // evita o bug de EventTarget com threads no Bun
    coverage: {
      provider: "istanbul", // ← trocado de "v8" para "istanbul"
      reporter: ["text", "html"],
      include: ["lib/**", "app/api/**", "components/**"],
      exclude: [
        "**/*.test.*",
        "**/*.d.ts",
        "**/node_modules/**",
        "**/.next/**",
      ],
    },
  },
});