#!/usr/bin/env node
/**
 * desplegar-supabase.mjs — lleva a Supabase (nube) lo que entró a `main`: migraciones pendientes,
 * edge functions cambiadas, y antes de nada, que los secretos que el código necesita existan.
 *
 * 🔗 `docs/guides/despliegue-supabase.md` — por qué ⊥ es `supabase db push`, el orden, y qué
 * hacer cuando frena. La lógica que decide vive en `plan-supabase.mjs` (testeada sin red).
 *
 * Uso (desde la raíz del repo):
 *   node tools/deploy/desplegar-supabase.mjs --plan    [--desde <ref>]   # solo lectura (PR)
 *   node tools/deploy/desplegar-supabase.mjs --aplicar [--desde <ref>]   # escribe (main)
 *
 *   --desde <ref>   commit/tag del último despliegue OK. Decide qué functions cambiaron. Sin él (o
 *                   si el ref ⊥ existe) se despliegan TODAS: es lo seguro, ⊥ lo barato.
 *
 * Entorno:
 *   SUPABASE_ACCESS_TOKEN   token de la cuenta (API de gestión + CLI)
 *   SUPABASE_PROD_REF       ref del proyecto
 *   SUPABASE_DEPLOY_DB=docker:<contenedor>   SOLO para probar contra la base local: usa `psql`
 *                   dentro del contenedor en vez de la API. Secretos y functions se saltean a los
 *                   gritos (⊥ hay API local para eso).
 *
 * Sale con 1 ante cualquier cosa que impida desplegar. Un paso que ⊥ corrió se dice: ⊥ es verde.
 */

import { readFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  leerMigracionesLocales,
  planificarMigraciones,
  controlDeTransaccion,
  sqlParaAplicar,
  leerFunctionsLocales,
  functionsAfectadas,
  secretosLeidosEnCodigo,
  revisarSecretos,
  planificarAuth,
} from "./plan-supabase.mjs";

const RAIZ = process.cwd();
const args = process.argv.slice(2);
const MODO = args.includes("--aplicar") ? "aplicar" : args.includes("--plan") ? "plan" : null;
const DESDE = (() => {
  const i = args.indexOf("--desde");
  return i >= 0 ? args[i + 1] : null;
})();

if (!MODO) {
  console.error("Uso: desplegar-supabase.mjs --plan | --aplicar [--desde <ref>]");
  process.exit(2);
}

const DB_LOCAL = process.env.SUPABASE_DEPLOY_DB?.startsWith("docker:")
  ? process.env.SUPABASE_DEPLOY_DB.slice("docker:".length)
  : null;
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROD_REF;
// `Connection: close`: sin eso el socket queda en el pool, y en Windows `process.exit()` con un
// handle abierto revienta en libuv (`UV_HANDLE_CLOSING`) y sale con 127 en vez del código real.
// Medido 2026-10-04. Un exit code mentiroso en CI es un verde/rojo mentiroso.
const CABECERAS = { Authorization: `Bearer ${TOKEN}`, Connection: "close" };

const resumen = [];
const linea = (s = "") => {
  console.log(s);
  resumen.push(s);
};
function terminar(codigo) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, "```\n" + resumen.join("\n") + "\n```\n");
  }
  process.exit(codigo);
}
function frenar(titulo, detalle = []) {
  linea(`\n✖ ${titulo}`);
  for (const d of detalle) linea(`   ${d}`);
  terminar(1);
}

if (!DB_LOCAL && (!TOKEN || !REF)) {
  frenar("Faltan SUPABASE_ACCESS_TOKEN y/o SUPABASE_PROD_REF en el entorno.", [
    "En CI: secrets del environment `produccion`. Local: `.env` + run-with-secrets.",
  ]);
}

// ─── Acceso a la base ────────────────────────────────────────────────────────

/**
 * API de gestión: `POST /v1/projects/{ref}/database/query`. Una consulta = un mensaje simple de
 * Postgres = UNA transacción implícita aunque traiga varias sentencias (lo que hace atómico
 * «archivo + registro»). `read_only` lo hace cumplir el servidor, ⊥ este script.
 */
async function consultarApi(sql, { soloLectura }) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { ...CABECERAS, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql, read_only: soloLectura }),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`API ${r.status}: ${texto.slice(0, 2000)}`);
  return texto ? JSON.parse(texto) : [];
}

/** Base local (prueba): `psql -c` manda el texto como UN mensaje simple, igual que la API. */
function consultarDocker(sql, { soloLectura }) {
  const envuelto = soloLectura
    ? `SET default_transaction_read_only = on; SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM (${sql.replace(/;\s*$/, "")}) t`
    : sql;
  const r = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      DB_LOCAL,
      "psql",
      "-U",
      "postgres",
      "-tA",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      envuelto,
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (r.status !== 0) throw new Error(`psql: ${(r.stderr || r.stdout).trim().slice(0, 2000)}`);
  if (!soloLectura) return [];
  // `-tA`: una línea `SET` y después el resultado en una sola línea (jsonb, a diferencia de
  // json_agg, ⊥ mete saltos entre elementos).
  const salida = r.stdout
    .trim()
    .split("\n")
    .filter((l) => l.startsWith("["))
    .at(-1);
  if (!salida) throw new Error(`psql ⊥ devolvió JSON: ${r.stdout.slice(0, 500)}`);
  return JSON.parse(salida);
}

const consultar = (sql, opciones) =>
  DB_LOCAL ? consultarDocker(sql, opciones) : consultarApi(sql, opciones);

async function authRemota() {
  if (DB_LOCAL) return null;
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    headers: CABECERAS,
  });
  if (!r.ok) throw new Error(`API config/auth ${r.status}: ${(await r.text()).slice(0, 500)}`);
  return r.json();
}

async function aplicarAuth(cambios) {
  const cuerpo = Object.fromEntries(cambios.map((c) => [c.clave, c.deseado]));
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`, {
    method: "PATCH",
    headers: { ...CABECERAS, "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok)
    throw new Error(`API PATCH config/auth ${r.status}: ${(await r.text()).slice(0, 500)}`);
}

async function secretosRemotos() {
  if (DB_LOCAL) return null;
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/secrets`, {
    headers: CABECERAS,
  });
  if (!r.ok) throw new Error(`API secrets ${r.status}: ${(await r.text()).slice(0, 500)}`);
  return new Set((await r.json()).map((s) => s.name));
}

// ─── git ─────────────────────────────────────────────────────────────────────

function archivosCambiadosDesde(ref) {
  if (!ref) return null;
  const existe = spawnSync("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], {
    encoding: "utf8",
  });
  if (existe.status !== 0) return null;
  const r = spawnSync("git", ["diff", "--name-only", `${ref}`, "HEAD"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git diff: ${r.stderr}`);
  return r.stdout
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// ─── 1. Plan ─────────────────────────────────────────────────────────────────

linea(`=== Despliegue Supabase — ${MODO === "plan" ? "PLAN (solo lectura)" : "APLICAR"}`);
linea(`    destino: ${DB_LOCAL ? `base local (docker ${DB_LOCAL})` : `proyecto ${REF}`}`);

/**
 * Los problemas se JUNTAN y se frena al final del plan: en un PR conviene ver todos de una, ⊥ uno
 * por corrida. Ninguno se saltea: cualquiera impide `--aplicar`.
 */
const problemas = [];
const problema = (titulo, detalle = []) => problemas.push({ titulo, detalle });

const rutaConfig = join(RAIZ, "supabase", "despliegue.json");
const config = existsSync(rutaConfig) ? JSON.parse(readFileSync(rutaConfig, "utf8")) : {};
const BASE = config.migraciones?.base ?? null;

const dirMigraciones = join(RAIZ, "supabase", "migrations");
const { migraciones: locales, invalidos } = leerMigracionesLocales(dirMigraciones);
if (invalidos.length) {
  problema("Hay archivos en supabase/migrations/ que ⊥ siguen `<14 dígitos>_<nombre>.sql`:", [
    ...invalidos,
    "Sin versión ⊥ hay con qué compararlos. Si ya están aplicados con otra versión, renombralos",
    "a la versión real (ver `schema_migrations`); si son borradores, van a migrations-draft/.",
  ]);
}

const remotas = await consultar(
  "select version, name from supabase_migrations.schema_migrations order by version",
  { soloLectura: true },
);
const plan = planificarMigraciones(locales, remotas, BASE);

if (plan.mismoNombreOtraVersion.length) {
  problema("Pendientes con el MISMO nombre que una migración ya aplicada con otra versión:", [
    ...plan.mismoNombreOtraVersion.map(
      ({ local, versionRemota }) =>
        `${local.archivo}  →  en la base es ${versionRemota}_${local.nombre}`,
    ),
    "Casi seguro ya corrió. Renombrá el archivo a la versión real; ⊥ se aplica de nuevo.",
  ]);
}
if (plan.fueraDeOrden.length) {
  problema("Pendientes MÁS VIEJOS que lo último aplicado de este repo:", [
    ...plan.fueraDeOrden.map((m) => m.archivo),
    "Suele ser historial de otro proyecto o un archivo con la versión equivocada. Si de verdad",
    "hay que aplicarlo, dale una versión nueva (posterior a todo) con su nombre. Si es historia",
    "que ⊥ se puede reconciliar, ver `migraciones.base` en docs/guides/despliegue-supabase.md.",
  ]);
}
for (const p of plan.pendientes) {
  const control = controlDeTransaccion(readFileSync(join(dirMigraciones, p.archivo), "utf8"));
  if (control.length) {
    problema(`${p.archivo} trae control de transacción propio (${control.join(", ")}).`, [
      "El despliegue aplica archivo + registro como UNA transacción; un COMMIT en el medio",
      "dejaría la mitad aplicada y sin registrar. Sacalo: cada archivo ya es atómico.",
    ]);
  }
}

linea(
  `\nMigraciones: ${locales.length} en el repo · ${remotas.length} en la base (todas las apps)`,
);
if (BASE)
  linea(`  base ${BASE}: ${plan.previasALaBase} archivos de historia previa, ⊥ se comparan`);
if (plan.pendientes.length) {
  linea(`  pendientes (${plan.pendientes.length}):`);
  for (const p of plan.pendientes) linea(`    + ${p.archivo}`);
} else linea("  ✓ ninguna pendiente");

// Config de Auth (solo las claves declaradas)
let planAuth = null;
if (config.auth) {
  const actual = await authRemota();
  const declaradas = Object.keys(config.auth).filter((k) => !k.startsWith("$") && k !== "porque");
  linea(`
Auth: ${declaradas.length} claves declaradas`);
  if (actual === null) linea("  ⊘ ⊥ comparadas (base local: ⊥ hay API de config)");
  else {
    planAuth = planificarAuth(config.auth, actual);
    if (planAuth.secretas.length) {
      problema("despliegue.json → auth declara claves SECRETAS (⊥ van en el repo):", [
        planAuth.secretas.join(", "),
        "Setealas en el panel; el repo solo lleva config que se puede leer en voz alta.",
      ]);
    }
    if (planAuth.desconocidas.length) {
      problema("despliegue.json → auth declara claves que el proyecto ⊥ tiene (¿typo?):", [
        planAuth.desconocidas.join(", "),
        "Los nombres son los de GET /v1/projects/{ref}/config/auth.",
      ]);
    }
    if (planAuth.cambios.length) {
      for (const c of planAuth.cambios) {
        linea(`  ~ ${c.clave}: ${JSON.stringify(c.actual)} → ${JSON.stringify(c.deseado)}`);
      }
    } else linea("  ✓ el proyecto ya tiene esos valores");
  }
}

// Secretos
const dirFunctions = join(RAIZ, "supabase", "functions");
const functionsLocales = leerFunctionsLocales(dirFunctions);
const cambiados = archivosCambiadosDesde(DESDE);
const afectadas = functionsAfectadas(cambiados, functionsLocales);

if (functionsLocales.length) {
  const manifiesto = config.secretos;
  if (!manifiesto) {
    problema("El repo tiene edge functions y supabase/despliegue.json ⊥ declara `secretos`.", [
      '{ "secretos": { "requeridos": [...], "opcionales": [...] } } — sin eso ⊥ se puede saber',
      "qué tiene que existir en el proyecto antes de desplegar.",
    ]);
  } else {
    const remotos = await secretosRemotos();
    const revision = revisarSecretos(manifiesto, secretosLeidosEnCodigo(dirFunctions), remotos);
    linea(`\nSecretos: ${(manifiesto.requeridos ?? []).length} requeridos`);
    if (revision.sinDeclarar.length) {
      problema("El código de las functions lee secretos que `secretos` ⊥ declara:", [
        revision.sinDeclarar.join(", "),
        "Sumalos a `requeridos` (si sin ellos la function falla) o a `opcionales`.",
      ]);
    }
    if (remotos === null)
      linea("  ⊘ ⊥ verificados contra el proyecto (base local: ⊥ hay API de secretos)");
    else if (revision.faltan.length) {
      problema("Faltan secretos requeridos en el proyecto (Edge Functions → Secrets):", [
        revision.faltan.join(", "),
        "Se frena ANTES de aplicar nada: una function desplegada sin su secreto falla en producción.",
      ]);
    } else linea("  ✓ todos seteados en el proyecto");
  }
}

linea(
  `\nEdge functions: ${functionsLocales.length} en el repo` +
    (cambiados === null ? " · sin punto de partida → todas" : ` · cambios desde ${DESDE}`),
);
if (afectadas.desplegar.length) linea(`  desplegar: ${afectadas.desplegar.join(", ")}`);
else if (functionsLocales.length) linea("  ✓ ninguna cambió");
if (afectadas.borradas.length) {
  linea(`  ⚠ borradas en el repo, siguen en el proyecto: ${afectadas.borradas.join(", ")}`);
  linea("    ⊥ se borran solas (proyecto compartido: `--prune` se llevaría las de otras apps).");
}

if (problemas.length) {
  for (const { titulo, detalle } of problemas) {
    linea(`\n✖ ${titulo}`);
    for (const d of detalle) linea(`   ${d}`);
  }
  linea(
    `\n${problemas.length} problema(s): ${MODO === "plan" ? "así ⊥ se puede desplegar" : "NADA se aplicó"}.`,
  );
  terminar(1);
}

if (MODO === "plan") {
  linea("\nPLAN: nada se escribió.");
  terminar(0);
}

// ─── 2. Aplicar migraciones ──────────────────────────────────────────────────

for (const p of plan.pendientes) {
  const sql = readFileSync(join(dirMigraciones, p.archivo), "utf8");
  try {
    await consultar(sqlParaAplicar(p, sql), { soloLectura: false });
  } catch (e) {
    frenar(`Falló ${p.archivo} — ⊥ quedó aplicada (archivo y registro van juntos).`, [
      String(e.message ?? e),
      plan.pendientes.indexOf(p) > 0
        ? "Las anteriores de esta corrida SÍ quedaron aplicadas."
        : "Ninguna de esta corrida se aplicó.",
    ]);
  }
  // Post-check contra la base, ⊥ contra la respuesta: que la API devuelva 2xx ⊥ prueba el registro.
  const quedo = await consultar(
    `select 1 as ok from supabase_migrations.schema_migrations where version = '${p.version}'`,
    { soloLectura: true },
  );
  if (!quedo.length) frenar(`${p.archivo}: la consulta volvió OK y la versión ⊥ está registrada.`);
  linea(`  ✓ aplicada ${p.archivo}`);
}

// ─── 2b. Config de Auth ──────────────────────────────────────────────────────

if (planAuth?.cambios.length) {
  try {
    await aplicarAuth(planAuth.cambios);
  } catch (e) {
    frenar("Falló el cambio de config de Auth.", [
      String(e.message ?? e),
      "Las migraciones de esta corrida YA están aplicadas.",
    ]);
  }
  // Post-check contra el proyecto: un 2xx ⊥ prueba que el valor quedó.
  const despues = planificarAuth(config.auth, await authRemota());
  if (despues.cambios.length) {
    frenar(
      "El PATCH de Auth volvió OK y estos valores ⊥ quedaron:",
      despues.cambios.map((c) => c.clave),
    );
  }
  linea(`  ✓ auth: ${planAuth.cambios.map((c) => c.clave).join(", ")}`);
}

// ─── 3. Desplegar functions ──────────────────────────────────────────────────

if (afectadas.desplegar.length && DB_LOCAL) {
  linea(`\n⊘ functions ⊥ desplegadas: base local (${afectadas.desplegar.join(", ")})`);
} else {
  for (const nombre of afectadas.desplegar) {
    const argv = ["functions", "deploy", nombre, "--project-ref", REF, "--use-api"];
    // 🔴 Jamás `--prune`: borra del proyecto toda function que ⊥ esté en ESTE repo, o sea las de
    // las otras apps del proyecto compartido.
    if (argv.includes("--prune")) throw new Error("--prune prohibido");
    const r = spawnSync("supabase", argv, {
      encoding: "utf8",
      shell: process.platform === "win32",
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: TOKEN },
    });
    if (r.status !== 0) {
      frenar(`Falló el deploy de la function ${nombre}.`, [
        (r.stderr || r.stdout || "").trim().slice(0, 2000),
        "Las migraciones de esta corrida YA están aplicadas; las functions anteriores, desplegadas.",
      ]);
    }
    linea(`  ✓ desplegada ${nombre}`);
  }
}

linea("\n✓ Despliegue completo.");
terminar(0);
