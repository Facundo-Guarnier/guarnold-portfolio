import { defineConfig } from 'vitest/config';

/**
 * Integración contra el stack LOCAL de Supabase (`npm run db:local` antes). ⊥ corre en `npm test`:
 * necesita Docker. Config aparte para que `npm test` siga siendo unitario y rápido.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integracion/**/*.test.ts'],
    testTimeout: 30_000,
    // Los tests escriben en la misma base: de a uno.
    fileParallelism: false,
    globalSetup: ['tests/integracion/global-setup.ts'],
  },
});
