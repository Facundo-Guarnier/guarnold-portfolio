#!/usr/bin/env node
/**
 * Base LOCAL de Docker: la reconstruye desde las migraciones versionadas.
 *
 *   node tools/scripts/db-local.mjs reset    → base vacia + migrations/ + drafts + grants + seed local
 *   node tools/scripts/db-local.mjs drafts   → re-aplica supabase/migrations-draft/ + grants (sin reset)
 *
 * Existe porque `supabase start` / `supabase db reset` aplican TODO `supabase/migrations/` y
 * mueren en el primer error — y 3 migraciones viejas ⊥ corren sobre una base limpia (ver SALTEAR).
 * Esas migraciones ya estan aplicadas en la nube y son inmutables ∴ ⊥ se editan: se saltean aca,
 * con el motivo escrito. Por eso `config.toml` tiene `[db.migrations] enabled = false`.
 *
 * Drafts (`supabase/migrations-draft/*.sql`): el trabajo NUEVO, todavia ⊥ aplicado a la nube.
 * Se aplican en orden alfabetico despues de las migraciones. Tienen que ser idempotentes —
 * `drafts` los vuelve a correr sobre la base viva en cada iteracion.
 *
 * Sin `psql` en la maquina: todo va por `docker exec` al contenedor de Postgres.
 */

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SUPABASE = path.join(RAIZ, 'supabase')
const MIGRACIONES = path.join(SUPABASE, 'migrations')
const DRAFTS = path.join(SUPABASE, 'migrations-draft')
const SEED = path.join(SUPABASE, 'seed', 'local.sql')
// GRANTs que la nube da fuera del repo y el stack local ⊥. Motivo en el archivo.
const GRANTS = path.join(SUPABASE, 'seed', 'grants-plataforma.sql')

/**
 * Migraciones que ⊥ se pueden re-ejecutar sobre base limpia. Son TODAS de datos, ⊥ de esquema:
 * saltearlas deja el mismo esquema que la nube (verificado 2026-09-29: las otras 52 aplican limpio).
 * ⊥ agregar una migracion de ESQUEMA aca: el esquema local dejaria de parecerse al de prod
 * y el Docker daria verde probando otra base.
 */
const SALTEAR = {
  '20260117170000_seed_clients.sql':
    'Clientes de demo con `id_rol = 6` fijo. En la nube el rol cliente quedo con id 6; en base limpia es 3 → viola la FK.',
  '20260131100000_seed_public_customer.sql':
    'Consumidor Final sin fila en auth.users → viola fk_usuarios_auth_users. Lo reemplaza supabase/seed/local.sql.',
  '20260314211217_historical_data_purge.sql':
    'Purga de datos con `\\set` de psql dentro de un DO $$ (psql ⊥ interpola ahi). En base vacia ⊥ hay nada que purgar.',
}

/** Contenedor de Postgres de ESTE repo: `supabase_db_<project_id>`. ⊥ "el primero que corra". */
function contenedorDb() {
  const toml = readFileSync(path.join(SUPABASE, 'config.toml'), 'utf8')
  const m = toml.match(/^project_id\s*=\s*"([^"]+)"/m)
  if (!m) salir('config.toml ⊥ tiene project_id.')
  const nombre = `supabase_db_${m[1]}`
  const corriendo = execSync('docker ps --format {{.Names}}', { encoding: 'utf8' }).split(/\r?\n/)
  if (!corriendo.includes(nombre)) salir(`${nombre} ⊥ esta corriendo. Corré: npm run db:start`)
  return nombre
}

function salir(msg) {
  console.error(`[db-local] ❌ ${msg}`)
  process.exit(1)
}

/** Corre un .sql entero en UNA transaccion: falla → ⊥ queda a medias. */
function aplicar(contenedor, archivo) {
  try {
    execSync(
      `docker exec -i ${contenedor} psql -U postgres -d postgres -q -v ON_ERROR_STOP=1 --single-transaction -f -`,
      { input: readFileSync(archivo), stdio: ['pipe', 'ignore', 'pipe'] },
    )
  } catch (e) {
    const err = String(e.stderr || e.message)
      .split('\n')
      .filter((l) => /ERROR|DETAIL|HINT/.test(l))
      .join('\n')
    salir(`fallo ${path.relative(RAIZ, archivo)}\n${err}`)
  }
}

function sqlDe(dir) {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.sql')).sort() : []
}

function aplicarDrafts(contenedor) {
  const drafts = sqlDe(DRAFTS)
  for (const f of drafts) {
    aplicar(contenedor, path.join(DRAFTS, f))
    console.log(`[db-local]   draft ${f}`)
  }
  // Despues de los drafts: una tabla nueva de un draft tambien necesita sus GRANTs.
  aplicar(contenedor, GRANTS)
  return drafts.length
}

/**
 * `.env.docker` = lo que lee `npm run dev:docker` (`vite --mode docker`): pisa URL y key del
 * `.env` para que el frontend hable con Docker y ⊥ con la nube. Se regenera en cada reset desde
 * `supabase status` ∴ ⊥ hay valores a mano que se desactualicen. Gitignoreado.
 */
function escribirEnvDocker() {
  const env = execSync('supabase status -o env', { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  const leer = (k) => (env.match(new RegExp(`^${k}="?([^"\\r\\n]+)"?`, 'm')) || [])[1]
  const url = leer('API_URL')
  const anon = leer('ANON_KEY')
  const db = leer('DB_URL')
  if (!url || !anon || !db) salir('`supabase status` ⊥ devolvio API_URL / ANON_KEY / DB_URL.')
  writeFileSync(
    path.join(RAIZ, '.env.docker'),
    `# Generado por tools/scripts/db-local.mjs — ⊥ editar. Stack LOCAL de Docker.\n` +
      `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${anon}\n` +
      // Sin prefijo VITE_ ∴ ⊥ llega al bundle. Lo usan los tests (tests/setup/), que leen SOLO este archivo.
      `SUPABASE_DB_URL=${db}\n`,
  )
  console.log(`[db-local] ✓ .env.docker → ${url}  (npm run dev:docker)`)
}

const comando = process.argv[2]

if (comando === 'reset') {
  // Un nombre en SALTEAR que ⊥ existe = alguien renombro el archivo y el salteo ⊥ saltea nada.
  const migraciones = sqlDe(MIGRACIONES)
  for (const f of Object.keys(SALTEAR)) {
    if (!migraciones.includes(f)) salir(`SALTEAR nombra ${f}, que ⊥ existe en supabase/migrations/.`)
  }

  const contenedor = contenedorDb()
  console.log('[db-local] Base vacia (supabase db reset)…')
  execSync('supabase db reset', { cwd: RAIZ, stdio: ['ignore', 'ignore', 'inherit'] })

  let aplicadas = 0
  for (const f of migraciones) {
    if (SALTEAR[f]) {
      console.log(`[db-local]   ⏭  ${f} — ${SALTEAR[f]}`)
      continue
    }
    aplicar(contenedor, path.join(MIGRACIONES, f))
    aplicadas++
  }
  console.log(`[db-local] ✓ ${aplicadas} migraciones · ${Object.keys(SALTEAR).length} salteadas`)

  const d = aplicarDrafts(contenedor)
  console.log(`[db-local] ✓ ${d} drafts + grants`)

  aplicar(contenedor, SEED)
  console.log('[db-local] ✓ seed local (admin@local.test / admin1234 + Consumidor Final)')
  console.log('[db-local] ⚠️  GRANTs PROVISORIOS: ⊥ verificados contra prod (supabase/seed/grants-plataforma.sql)')

  escribirEnvDocker()
} else if (comando === 'drafts') {
  const d = aplicarDrafts(contenedorDb())
  console.log(`[db-local] ✓ ${d} drafts re-aplicados`)
} else {
  salir('uso: node tools/scripts/db-local.mjs <reset|drafts>')
}
