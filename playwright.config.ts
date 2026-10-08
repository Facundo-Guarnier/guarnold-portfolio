import { defineConfig } from '@playwright/test';
import { PUERTO_APP, URL_APP } from './tools/local/entorno.mjs';

/**
 * E2E de cv-formatter contra el stack LOCAL (`npm run db:local` antes) y `vite --mode docker`.
 * Mismo patrón que guarnold-id: webServer de Playwright, un solo origen.
 *
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  // Un solo worker: los tests comparten la base local (el perfil y las cuentas de prueba).
  workers: 1,
  use: { headless: true, baseURL: URL_APP },
  webServer: {
    command: `npx vite --mode docker --port ${PUERTO_APP} --strictPort`,
    url: URL_APP,
    // Si ya hay un `npm run dev:docker` arriba, lo reusa en vez de fallar por el puerto.
    reuseExistingServer: !process.env.CI,
  },
});
