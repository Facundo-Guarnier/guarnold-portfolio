#!/usr/bin/env node
/**
 * Levanta y prepara el stack LOCAL de Supabase de cv-formatter (Docker). ⊥ toca la nube.
 *
 *   node tools/local/preparar-stack.mjs            → levanta (si hace falta) y aplica lo pendiente
 *   node tools/local/preparar-stack.mjs --reset    → borra la base local y la reconstruye desde cero
 *
 * Qué hace, en orden:
 *   1. `supabase start` (el stack de ESTE repo: `supabase_db_cv-formatter`, puertos 5438x).
 *   2. Prerrequisito de `plataforma` (`has_app_access`): el archivo vive en el repo de GuarNote y se
 *      LEE de ahí (⊥ se copia: dos copias divergen). Se aplica una sola vez.
 *   3. Las migraciones de `supabase/migrations/` que ⊥ estén aplicadas. Cada una en su transacción.
 *      El registro va a `supabase_migrations.schema_migrations`, la misma tabla que usa el CLI.
 *   4. Dos cuentas de prueba (GoTrue admin API, con la clave de servicio LOCAL): una CON acceso a
 *      cv-formatter y otra SIN acceso. Y una fila de perfil si ⊥ hay ninguna.
 *   5. `.env.docker.local`: la config que lee `npm run dev:docker` (`vite --mode docker`). Es un
 *      archivo de modo: ⊥ pisa el `.env` de la nube ni lo afecta.
 *
 * Por qué `db.migrations` está apagado en config.toml: el CLI aplicaría las migraciones antes que
 * `plataforma` existe, y fallaría en la primera. Acá el orden es explícito.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  CONTENEDOR_DB,
  RAIZ,
  SUPABASE,
  URL_APP,
  USUARIO_CON_ACCESO,
  USUARIO_SIN_ACCESO,
  leerStack,
} from './entorno.mjs';

const MIGRACIONES = path.join(RAIZ, 'supabase', 'migrations');
const RESET = process.argv.includes('--reset');

/**
 * Migraciones de OTRO repo (GuarNote) que cv-formatter necesita, en orden. Solo las que
 * `plataforma.has_app_access()` usa: `app_access`, la función y el backfill. Las posteriores
 * (apps, administración, auditoría) ⊥ las usa cv-formatter; sumarlas es un cambio consciente.
 */
const PREREQUISITOS = [
  { repo: 'guarnote', archivo: '20261002234342_plataforma_acceso_por_app.sql' },
];

/** Stub: el backfill de `plataforma_acceso_por_app` lee `guarnote.user_roles`. Base vacía ⇒ vacía. */
const STUB_GUARNOTE = `
CREATE SCHEMA IF NOT EXISTS guarnote;
CREATE TABLE IF NOT EXISTS guarnote.user_roles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL,
  PRIMARY KEY (user_id, role_id)
);`;

const REGISTRO = `
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version text PRIMARY KEY,
  statements text[],
  name text
);`;

function salir(msg) {
  console.error(`\n[db:local] ❌ ${msg}`);
  process.exit(1);
}

const log = (msg) => console.log(`[db:local] ${msg}`);

/** Corre un comando y tira si falla. Hereda la salida solo si `mostrar` es true. */
function correr(cmd, args, { mostrar = false, input } = {}) {
  const r = spawnSync(cmd, args, {
    cwd: RAIZ,
    encoding: 'utf8',
    input,
    stdio: [input !== undefined ? 'pipe' : 'ignore', mostrar ? 'inherit' : 'pipe', 'pipe'],
  });
  return r;
}

/** SQL contra la base local, en UNA transacción: si falla, ⊥ queda a medias. */
function sql(texto, { singleTransaction = true } = {}) {
  const args = ['exec', '-i', CONTENEDOR_DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-q', '-v', 'ON_ERROR_STOP=1'];
  if (singleTransaction) args.push('--single-transaction');
  args.push('-f', '-');
  const r = correr('docker', args, { input: texto });
  if (r.status !== 0) {
    const err = (r.stderr || '').split('\n').filter((l) => /ERROR|DETAIL|HINT|FATAL/.test(l)).join('\n');
    throw new Error(err || r.stderr || 'psql falló');
  }
  return r.stdout;
}

/** Una consulta que devuelve un valor (sin encabezados). */
function valor(consulta) {
  const r = correr('docker', ['exec', CONTENEDOR_DB, 'psql', '-U', 'postgres', '-d', 'postgres', '-tA', '-c', consulta]);
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.trim();
}

const escapar = (s) => s.replace(/'/g, "''");

function asegurarDocker() {
  const r = correr('docker', ['info', '--format', '{{.ServerVersion}}']);
  if (r.status !== 0) salir('Docker ⊥ está corriendo. Abrí Docker Desktop y volvé a correr este script.');
}

function levantar() {
  log(RESET ? 'Reset: apago el stack y borro sus volúmenes…' : 'Levantando el stack (supabase start)…');
  if (RESET) {
    const r = correr(SUPABASE, ['stop', '--no-backup'], { mostrar: true });
    if (r.status !== 0) salir('`supabase stop --no-backup` falló.');
  }
  const r = correr(SUPABASE, ['start'], { mostrar: false });
  if (r.status !== 0) {
    salir(`\`supabase start\` falló:\n${(r.stdout || '') + (r.stderr || '')}`.slice(0, 2000));
  }
}

function leerPrerequisito({ repo, archivo }) {
  const base = process.env.GUARNOTE_REPO || path.resolve(RAIZ, '..', repo);
  const ruta = path.join(base, 'supabase', 'migrations', archivo);
  if (!existsSync(ruta)) {
    salir(
      `No encuentro ${ruta}.\n` +
        '  Es el prerrequisito de `plataforma` (repo guarnote). Cloná el repo junto a cv-formatter o\n' +
        '  apuntá GUARNOTE_REPO a su carpeta.',
    );
  }
  return { ruta, texto: readFileSync(ruta, 'utf8') };
}

function aplicarMigraciones() {
  sql(REGISTRO);
  const aplicadas = new Set(
    valor('SELECT version FROM supabase_migrations.schema_migrations').split('\n').filter(Boolean),
  );

  // 1. Prerrequisitos de otro repo.
  for (const p of PREREQUISITOS) {
    const version = `${p.repo}-${p.archivo.slice(0, 14)}`;
    if (aplicadas.has(version)) continue;
    const { ruta, texto } = leerPrerequisito(p);
    log(`prerrequisito ${p.repo}/${p.archivo}`);
    sql(
      `BEGIN;\n${STUB_GUARNOTE}\n${texto}\n` +
        `INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('${version}', '${escapar(p.archivo)}');\n` +
        'COMMIT;\n',
      { singleTransaction: false },
    );
    aplicadas.add(version);
    log(`  ✓ ${path.relative(RAIZ, ruta)}`);
  }

  // 2. Migraciones de este repo, en orden.
  const archivos = readdirSync(MIGRACIONES).filter((f) => f.endsWith('.sql')).sort();
  let nuevas = 0;
  for (const f of archivos) {
    const version = f.slice(0, f.indexOf('_'));
    if (aplicadas.has(version)) continue;
    log(`migración ${f}`);
    const texto = readFileSync(path.join(MIGRACIONES, f), 'utf8');
    sql(
      `${texto}\n;\nINSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('${version}', '${escapar(f)}');\n`,
    );
    nuevas++;
  }
  log(nuevas ? `✓ ${nuevas} migraciones aplicadas` : '✓ migraciones al día');
}

async function asegurarCuenta(stack, { email, clave }) {
  const r = await fetch(`${stack.apiUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: stack.serviceKey,
      Authorization: `Bearer ${stack.serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password: clave, email_confirm: true }),
  });
  if (!r.ok && r.status !== 422) {
    salir(`GoTrue ⊥ creó ${email}: ${r.status} ${await r.text()}`);
  }
  const id = valor(`SELECT id FROM auth.users WHERE email = '${escapar(email)}'`);
  if (!id) salir(`${email} ⊥ existe en auth.users tras el alta.`);
  return id;
}

function prepararDatos(idConAcceso, idSinAcceso) {
  sql(
    `INSERT INTO plataforma.app_access (user_id, app, nota)
       VALUES ('${idConAcceso}', 'cv-formatter', 'local: cuenta de prueba con acceso')
     ON CONFLICT (user_id, app) DO UPDATE SET revoked_at = NULL;
     DELETE FROM plataforma.app_access WHERE user_id = '${idSinAcceso}' AND app = 'cv-formatter';
     INSERT INTO "cv-formatter".profiles (nombre, titulo, email, ubicacion, resumen)
       SELECT 'Persona de prueba', 'Ingeniero (datos locales)', 'local@ejemplo.com', 'Mendoza', ''
       WHERE NOT EXISTS (SELECT 1 FROM "cv-formatter".profiles);`,
  );
}

function escribirEnvLocal(stack) {
  if (!stack.apiUrl.includes('127.0.0.1') && !stack.apiUrl.includes('localhost')) {
    salir(`La API ⊥ es local (${stack.apiUrl}). ⊥ escribo .env.docker.local apuntando a otro lado.`);
  }
  const ruta = path.join(RAIZ, '.env.docker.local');
  writeFileSync(
    ruta,
    '# Generado por tools/local/preparar-stack.mjs — ⊥ editar a mano. Stack LOCAL (Docker).\n' +
      '# Lo lee `vite --mode docker` (npm run dev:docker). Gitignoreado por `.env.*.local`.\n' +
      `VITE_SUPABASE_URL=${stack.apiUrl}\n` +
      `VITE_SUPABASE_ANON_KEY=${stack.anonKey}\n` +
      'VITE_SUPABASE_SCHEMA=cv-formatter\n' +
      // Vacío = sin Guarnold ID: login propio contra el stack local (lib/sesionCentral.ts).
      'VITE_CUENTA_URL=\n',
  );
  return ruta;
}

async function main() {
  asegurarDocker();
  levantar();
  aplicarMigraciones();

  const stack = leerStack();
  const conAcceso = await asegurarCuenta(stack, USUARIO_CON_ACCESO);
  const sinAcceso = await asegurarCuenta(stack, USUARIO_SIN_ACCESO);
  prepararDatos(conAcceso, sinAcceso);
  const envPath = escribirEnvLocal(stack);

  console.log(`
[db:local] ✓ Listo.

  App (local)        ${URL_APP}    →  npm run dev:docker
  API                ${stack.apiUrl}
  Studio             http://127.0.0.1:54383
  Postgres           ${stack.dbUrl}
  Config de la app   ${path.relative(RAIZ, envPath)}

  Cuenta CON acceso  ${USUARIO_CON_ACCESO.email}  /  ${USUARIO_CON_ACCESO.clave}
  Cuenta SIN acceso  ${USUARIO_SIN_ACCESO.email}  /  ${USUARIO_SIN_ACCESO.clave}
`);
}

main().catch((e) => salir(e.message));
