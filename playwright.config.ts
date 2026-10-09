import { defineConfig, devices } from "@playwright/test";
import { PUERTO_APP, URL_APP } from "./tools/local/entorno.mjs";

/**
 * E2E de la app (portfolio + CV). Registro de puertos: guarnold-hub/PUERTOS.md.
 *
 * Dos servidores, a propósito:
 *
 * - **3001 · portfolio** (`portfolio-*.spec.ts`): Supabase FALSO por variables de entorno, y los tests
 *   interceptan la RPC `portfolio_publico`. ⊥ necesita Docker.
 * - **5177 · CV + navegación** (`cv-*.spec.ts`): `vite --mode docker` contra el stack LOCAL de
 *   Supabase. Necesita `npm run db:local` antes.
 *
 * Un solo worker: los specs del CV comparten la base local (perfil y cuentas de prueba).
 *
 *   npm run test:e2e
 */
const PUERTO_PORTFOLIO = 3001;
const URL_PORTFOLIO = `http://localhost:${PUERTO_PORTFOLIO}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  projects: [
    {
      name: "portfolio",
      testMatch: /portfolio-.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: URL_PORTFOLIO, headless: true, viewport: { width: 1280, height: 900 } },
    },
    {
      name: "cv",
      testMatch: /cv-.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: URL_APP, headless: true, viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: [
    {
      command: `npx vite --port ${PUERTO_PORTFOLIO} --strictPort`,
      url: URL_PORTFOLIO,
      // Siempre uno nuevo: si reusara un dev server normal, el Supabase falso ⊥ se aplicaría.
      reuseExistingServer: false,
      env: {
        VITE_SUPABASE_URL: "https://supabase-falso.invalid",
        VITE_SUPABASE_ANON_KEY: "anon-falsa-solo-para-e2e",
      },
    },
    {
      command: `npx vite --mode docker --port ${PUERTO_APP} --strictPort`,
      url: URL_APP,
      // Si ya hay un `npm run dev:docker` arriba, lo reusa en vez de fallar por el puerto.
      reuseExistingServer: !process.env.CI,
    },
  ],
});
