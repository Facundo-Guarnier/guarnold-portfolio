import { leerStack } from '../../tools/local/entorno.mjs';

/**
 * Falla temprano y con un mensaje claro si el stack local ⊥ está arriba. Sin esto, el primer test
 * fallaría con un `fetch failed` que ⊥ dice por qué.
 */
export default async function setup() {
  const stack = leerStack();
  const r = await fetch(`${stack.apiUrl}/auth/v1/health`).catch(() => null);
  if (!r || !r.ok) {
    throw new Error(`La API local (${stack.apiUrl}) ⊥ responde. Levantá el stack: npm run db:local`);
  }
}
