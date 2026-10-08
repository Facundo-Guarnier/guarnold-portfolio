import { defineConfig } from "vitest/config";
import yaml from "@rollup/plugin-yaml";

// Tests unitarios: solo `src/`. Los E2E de Playwright viven en `e2e/` y corren con `npm run test:e2e`.
export default defineConfig({
  plugins: [yaml()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
