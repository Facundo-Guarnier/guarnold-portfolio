import { defineConfig, devices } from "@playwright/test";

/**
 * Puerto de ESTE repo (registro: guarnold-hub/PUERTOS.md). Dev server con Supabase FALSO: las
 * variables de entorno ganan sobre el `.env` real de Vite, y los tests interceptan la RPC.
 */
const PUERTO = 3001;
const BASE = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: BASE,
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite --port ${PUERTO} --strictPort`,
    url: BASE,
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://supabase-falso.invalid",
      VITE_SUPABASE_ANON_KEY: "anon-falsa-solo-para-e2e",
    },
  },
});
