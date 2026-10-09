import { defineConfig } from 'vitest/config';
import yaml from '@rollup/plugin-yaml';
import path from 'path';

/**
 * Tests UNITARIOS (`npm test`): el portfolio (`src/`) y el CV (`src/cv/`) juntos, más las
 * herramientas de despliegue y cabeceras (`tools/`). ⊥ necesitan Docker ni red.
 *
 * Quedan afuera a propósito: la integración contra el stack local (`tests/integracion`, con
 * `npm run test:integracion`) y el E2E de Playwright (`e2e/`, con `npm run test:e2e`).
 */
export default defineConfig({
  plugins: [yaml()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'tests/integracion/**', 'e2e/**'],
  },
});
