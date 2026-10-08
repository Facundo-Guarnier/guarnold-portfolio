#!/usr/bin/env node
/**
 * Pruebas SQL de cv-formatter contra el stack LOCAL (Docker). Corre cada `supabase/tests/*.sql`
 * en su propia transacción y la deshace al final: ⊥ deja nada en la base.
 *
 *   npm run test:sql            (requiere `npm run db:local` antes)
 *
 * Las migraciones ⊥ se re-aplican acá: ya están en el stack (las pone `preparar-stack.mjs`) y
 * varias crean policies sin `IF NOT EXISTS`. Las pruebas sí asumen el esquema actual.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { CONTENEDOR_DB, RAIZ } from './entorno.mjs';

const CARPETA = path.join(RAIZ, 'supabase', 'tests');
const archivos = readdirSync(CARPETA).filter((f) => f.endsWith('.sql')).sort();

const existe = spawnSync('docker', ['exec', CONTENEDOR_DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-tAc', `SELECT to_regclass('"cv-formatter".profiles') IS NOT NULL`], { encoding: 'utf8' });
if (existe.status !== 0 || existe.stdout.trim() !== 't') {
  console.error('[test:sql] ❌ El esquema cv-formatter ⊥ está en el stack local. Corré: npm run db:local');
  process.exit(1);
}

// Hijos primero: `profiles` ⊥ se borra con datos colgando (social_links no tiene ON DELETE CASCADE).
const VACIAR = [
  'social_links',
  'experiences',
  'education',
  'skills',
  'projects',
  'perfil_items',
]
  .map((t) => `DELETE FROM "cv-formatter".${t};`)
  .concat('DELETE FROM "cv-formatter".profiles;')
  .join('\n');

let fallos = 0;
for (const f of archivos) {
  const cuerpo = readFileSync(path.join(CARPETA, f), 'utf8');
  // Cada archivo ⊥ es uniforme: algunos abren BEGIN, otros no. El BEGIN extra es un WARNING, y el
  // ROLLBACK final cierra lo que quede abierto. Lo que importa: NADA persiste.
  // Las pruebas asumen UN solo perfil (la RPC toma el primero): se vacía dentro de la transacción y el
  // ROLLBACK devuelve el perfil que dejó `db:local`. Los hijos caen por ON DELETE CASCADE.
  const script = `\\set ON_ERROR_STOP 1\nBEGIN;\n${VACIAR}\n${cuerpo}\nROLLBACK;\n`;
  const r = spawnSync(
    'docker',
    ['exec', '-i', CONTENEDOR_DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-q', '-v', 'ON_ERROR_STOP=1', '-f', '-'],
    { input: script, encoding: 'utf8' },
  );
  const salida = `${r.stdout}${r.stderr}`;
  const ok = r.status === 0 && salida.includes('OK:');
  console.log(`${ok ? '✓' : '✗'} ${f}`);
  if (!ok) {
    fallos++;
    console.log(salida.split('\n').filter((l) => /ERROR|FALLÓ|DETAIL|HINT|OK:/.test(l)).join('\n') || salida);
  }
}

if (fallos) {
  console.error(`\n[test:sql] ❌ ${fallos} de ${archivos.length} fallaron.`);
  process.exit(1);
}
console.log(`\n[test:sql] ✓ ${archivos.length} archivos, todos OK.`);
