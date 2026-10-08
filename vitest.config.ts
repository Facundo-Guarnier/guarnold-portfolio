import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
    // Integración (necesita el stack local de Docker) y E2E (Playwright) tienen su propio comando.
    exclude: ['node_modules/**', 'tests/integracion/**', 'e2e/**'],
  },
});
