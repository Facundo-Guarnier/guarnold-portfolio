/**
 * Constantes del stack LOCAL de cv-formatter (Docker). Las leen el preparador, los tests de
 * integración y el E2E. ⊥ son credenciales reales: son cuentas de prueba de la base local, y el
 * stack ⊥ es accesible desde afuera de la máquina.
 *
 * 🔗 AGENTS.md («Desarrollo local»).
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** En Windows el CLI es `supabase.exe` (sin `shell`: el shell ⊥ escapa los argumentos). */
export const SUPABASE = process.platform === 'win32' ? 'supabase.exe' : 'supabase';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Nombre del contenedor de Postgres: lo fija `project_id` de supabase/config.toml. */
export const CONTENEDOR_DB = 'supabase_db_cv-formatter';

/** Puerto del dev server (`vite.config.ts`). El modo local lo usa igual. */
export const PUERTO_APP = 5177;
export const URL_APP = `http://localhost:${PUERTO_APP}`;

/** Con acceso a cv-formatter: puede editar el CV. */
export const USUARIO_CON_ACCESO = {
  email: 'con-acceso@ejemplo.com',
  clave: 'cv-local-1234',
};

/** Tiene cuenta, pero ⊥ acceso a cv-formatter: las policies le niegan toda escritura. */
export const USUARIO_SIN_ACCESO = {
  email: 'sin-acceso@ejemplo.com',
  clave: 'cv-local-1234',
};

/**
 * Lee las URLs y claves del stack levantado (`supabase status -o env`). ⊥ se hardcodean: el
 * puerto sale de config.toml y la clave de la instancia local. Tira si el stack ⊥ está corriendo.
 */
export function leerStack() {
  let salida;
  try {
    salida = execFileSync(SUPABASE, ['status', '-o', 'env'], {
      cwd: RAIZ,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    throw new Error(
      'El stack local de cv-formatter ⊥ está corriendo. Levantalo con: npm run db:local',
      { cause: e },
    );
  }
  const leer = (clave) => (salida.match(new RegExp(`^${clave}="?([^"\\r\\n]+)"?`, 'm')) || [])[1];
  const apiUrl = leer('API_URL');
  const anonKey = leer('ANON_KEY');
  const serviceKey = leer('SERVICE_ROLE_KEY');
  const dbUrl = leer('DB_URL');
  if (!apiUrl || !anonKey || !serviceKey || !dbUrl) {
    throw new Error('`supabase status -o env` ⊥ devolvió API_URL / ANON_KEY / SERVICE_ROLE_KEY / DB_URL.');
  }
  return { apiUrl, anonKey, serviceKey, dbUrl };
}
