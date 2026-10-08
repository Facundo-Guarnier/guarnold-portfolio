/**
 * plan-supabase.mjs — la lógica PURA del despliegue a Supabase (sin red, sin git, sin disco salvo
 * donde se dice). Lo que decide QUÉ se aplica vive acá para poder testearlo sin un proyecto.
 *
 * 🔗 `docs/guides/despliegue-supabase.md` — el porqué de cada regla.
 *
 * ## Las dos trampas que este archivo existe para frenar
 *
 * El proyecto de Supabase puede estar COMPARTIDO por varios repos (un esquema por app, un solo
 * historial de migraciones). Por eso `supabase db push` ⊥ sirve: ve las migraciones de los otros
 * repos en el remoto, ⊥ las encuentra en local, y aborta. Y el arreglo que sugiere
 * (`migration repair --status reverted`) borraría del historial lo de las otras apps.
 *
 * Comparar «archivos locales − versiones remotas» a secas tampoco: medido el 2026-10-04,
 *   1. cv-formatter tiene `20260114_create_cv_formatter_schema.sql` y en la base quedó registrada
 *      como `20260115000436`. Comparando versiones, se volvería a correr la creación del esquema
 *      EN PRODUCCIÓN.
 *   2. pivot tuvo 6 archivos de 2024-25 que eran el historial de OTRO proyecto (⊥ aplicados en
 *      este). Comparando versiones, se aplicaban en `public`.
 * ∴ un pendiente MÁS VIEJO que lo último aplicado de este repo, o con el mismo nombre que algo
 * ya aplicado, frena el despliegue. ⊥ se adivina: se dice qué archivo y qué hacer.
 */

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

/** `<14 dígitos>_<nombre>.sql` — el formato que escribe el CLI y el wrapper del MCP. */
const RE_MIGRACION = /^(\d{14})_(.+)\.sql$/;

/**
 * Lee `supabase/migrations/`. Devuelve las válidas ordenadas y los archivos con nombre inválido
 * (que son un error: un `.sql` que ⊥ sigue el formato ⊥ tiene versión con qué compararlo).
 * @param {string} dir
 */
export function leerMigracionesLocales(dir) {
  if (!existsSync(dir)) return { migraciones: [], invalidos: [] };
  const migraciones = [];
  const invalidos = [];
  for (const archivo of readdirSync(dir).sort()) {
    if (!archivo.endsWith(".sql")) continue;
    const m = RE_MIGRACION.exec(archivo);
    if (!m) {
      invalidos.push(archivo);
      continue;
    }
    migraciones.push({ version: m[1], nombre: m[2], archivo });
  }
  return { migraciones, invalidos };
}

/**
 * Qué falta aplicar, y qué de eso es sospechoso.
 *
 * ## La base
 *
 * Un repo con historia previa al flujo actual (archivos aplicados por el panel, por Lovable, por
 * un proyecto anterior) ⊥ se puede reconciliar archivo por archivo — medido en GuarNote: 26
 * archivos registrados con otra versión y 26 que ⊥ figuran en la base por ningún nombre, con sus
 * efectos igual presentes. `base` declara «hasta esta versión inclusive, el repo es historia: la
 * verdad es producción». Esos archivos ⊥ se comparan ni se aplican; se informan como cantidad.
 *
 * @param {{version:string,nombre:string,archivo:string}[]} todasLasLocales
 * @param {{version:string,name:string|null}[]} remotas  filas de `schema_migrations`
 * @param {string|null} [base]  versión de 14 dígitos; null = sin historia previa
 * @returns {{
 *   pendientes: typeof todasLasLocales,
 *   fueraDeOrden: typeof todasLasLocales,
 *   mismoNombreOtraVersion: {local: (typeof todasLasLocales)[number], versionRemota: string}[],
 *   previasALaBase: number,
 * }}
 */
export function planificarMigraciones(todasLasLocales, remotas, base = null) {
  if (base !== null && !/^\d{14}$/.test(base)) throw new Error(`base inválida: ${base}`);
  const locales = base ? todasLasLocales.filter((l) => l.version > base) : todasLasLocales;
  const previasALaBase = todasLasLocales.length - locales.length;
  const versionesRemotas = new Set(remotas.map((r) => r.version));
  const pendientes = locales.filter((l) => !versionesRemotas.has(l.version));

  // «Lo último aplicado DE ESTE REPO»: la mayor versión local que ya está en el remoto. Las
  // versiones de los otros repos ⊥ cuentan: que pivot aplique algo hoy ⊥ vuelve viejo un
  // pendiente legítimo de guarnote escrito ayer.
  const aplicadasLocales = locales.filter((l) => versionesRemotas.has(l.version));
  const ultimaAplicada = aplicadasLocales.at(-1)?.version ?? null;

  const fueraDeOrden = ultimaAplicada ? pendientes.filter((p) => p.version < ultimaAplicada) : [];

  const porNombre = new Map(remotas.filter((r) => r.name).map((r) => [r.name, r.version]));
  const mismoNombreOtraVersion = pendientes
    .filter((p) => porNombre.has(p.nombre))
    .map((p) => ({ local: p, versionRemota: porNombre.get(p.nombre) }));

  return { pendientes, fueraDeOrden, mismoNombreOtraVersion, previasALaBase };
}

/**
 * Control de transacción adentro del archivo rompe la atomicidad: el despliegue manda archivo +
 * registro en `schema_migrations` como UNA sola consulta (= una transacción implícita). Un
 * `COMMIT;` en el medio confirmaría la mitad y dejaría el registro afuera.
 * @param {string} sql
 */
export function controlDeTransaccion(sql) {
  const sinComentarios = sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  // Fuera de los cuerpos `$$ … $$` (funciones/DO): ahí un BEGIN es el de PL/pgSQL, ⊥ uno de SQL.
  const fueraDeCuerpos = sinComentarios.replace(/\$([A-Za-z_]*)\$[\s\S]*?\$\1\$/g, "");
  const hallados = fueraDeCuerpos.match(
    /^\s*(BEGIN|COMMIT|ROLLBACK|START\s+TRANSACTION|END)\s*(TRANSACTION|WORK)?\s*;/gim,
  );
  return (hallados ?? []).map((s) => s.trim().replace(/\s+/g, " ").toUpperCase());
}

/** Un tag de dollar-quoting que ⊥ aparezca en el texto. */
function tagQueNoAparece(texto) {
  let n = 0;
  while (texto.includes(`$despliegue${n}$`)) n++;
  return `$despliegue${n}$`;
}

/**
 * El SQL que se manda para aplicar UNA migración: candado + archivo + registro, en una consulta.
 *
 * - El candado (`pg_advisory_xact_lock`) serializa despliegues de REPOS DISTINTOS sobre el mismo
 *   proyecto: el `concurrency` de GitHub es por repo y ⊥ los ve.
 * - El registro va en la misma transacción: si el archivo falla, ⊥ queda anotado como aplicado;
 *   si el registro falla, el archivo se deshace.
 * - `statements` lleva el archivo entero (el CLI guarda un elemento por sentencia; para auditar
 *   «qué corrió» alcanza con uno, y partir SQL a mano es la forma de equivocarse).
 *
 * @param {{version:string,nombre:string}} migracion
 * @param {string} sql
 */
export function sqlParaAplicar(migracion, sql) {
  if (!/^\d{14}$/.test(migracion.version))
    throw new Error(`versión inválida: ${migracion.version}`);
  const tag = tagQueNoAparece(sql + migracion.nombre);
  return [
    `SELECT pg_advisory_xact_lock(hashtext('guarnold:despliegue-migraciones'));`,
    sql.trimEnd(),
    ";",
    `INSERT INTO supabase_migrations.schema_migrations (version, name, statements)`,
    `VALUES ('${migracion.version}', ${tag}${migracion.nombre}${tag}, ARRAY[${tag}${sql}${tag}]);`,
  ].join("\n");
}

/**
 * El nombre con el que un borrador pasa a `supabase/migrations/` en un repo que despliega por CI.
 *
 * La versión es la hora UTC de la promoción, y TIENE que ser posterior a toda migración local: el
 * CI aplica en orden de nombre y frena ante un pendiente más viejo que lo ya aplicado. Si el reloj
 * da una versión ≤ a la última (reloj atrasado, dos promociones en el mismo segundo), se usa la
 * última + 1 segundo: ⊥ se adivina un orden, se garantiza.
 *
 * @param {string} desc  snake_case, empieza con letra
 * @param {Date} ahora
 * @param {string[]} versionesExistentes
 */
export function nombreDePromocion(desc, ahora, versionesExistentes) {
  if (!/^[a-z][a-z0-9_]*$/.test(desc))
    throw new Error(`descripción inválida: ${desc} (snake_case)`);
  const p = (n, l = 2) => String(n).padStart(l, "0");
  let version =
    `${ahora.getUTCFullYear()}${p(ahora.getUTCMonth() + 1)}${p(ahora.getUTCDate())}` +
    `${p(ahora.getUTCHours())}${p(ahora.getUTCMinutes())}${p(ahora.getUTCSeconds())}`;
  const ultima = [...versionesExistentes].sort().at(-1);
  if (ultima && version <= ultima) {
    const d = new Date(
      Date.UTC(
        +ultima.slice(0, 4),
        +ultima.slice(4, 6) - 1,
        +ultima.slice(6, 8),
        +ultima.slice(8, 10),
        +ultima.slice(10, 12),
        +ultima.slice(12, 14) + 1,
      ),
    );
    version = nombreDePromocion(desc, d, []).slice(0, 14);
  }
  return `${version}_${desc}.sql`;
}

// ─── Edge functions ──────────────────────────────────────────────────────────

/** Las functions del repo: carpetas de `supabase/functions/` con `index.ts`, sin las `_compartidas`. */
export function leerFunctionsLocales(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => !n.startsWith("_") && !n.startsWith("."))
    .filter((n) => statSync(join(dir, n)).isDirectory() && existsSync(join(dir, n, "index.ts")))
    .sort();
}

/**
 * Qué functions desplegar a partir de los archivos cambiados desde el último despliegue.
 *
 * Cambios que afectan a TODAS: cualquier cosa bajo `supabase/functions/_*` (código compartido),
 * `supabase/config.toml` (ahí vive `verify_jwt`) y los import maps / `deno.json` de la raíz de
 * functions. Sin punto de partida (`cambiados === null`: primer despliegue) → todas.
 *
 * Una function BORRADA en local ⊥ se borra del remoto: el proyecto puede ser compartido y
 * `--prune` se llevaría las de las otras apps. Se informa para borrarla a mano.
 *
 * @param {string[]|null} cambiados  rutas relativas a la raíz del repo, con `/`
 * @param {string[]} locales
 */
export function functionsAfectadas(cambiados, locales) {
  if (cambiados === null) return { desplegar: [...locales], borradas: [], todas: true };
  const tocaTodas = cambiados.some(
    (r) =>
      r === "supabase/config.toml" ||
      /^supabase\/functions\/_[^/]+\//.test(r) ||
      /^supabase\/functions\/(deno\.jsonc?|import_map\.json)$/.test(r),
  );
  if (tocaTodas)
    return { desplegar: [...locales], borradas: borradasDe(cambiados, locales), todas: true };

  const nombres = new Set();
  for (const r of cambiados) {
    const m = /^supabase\/functions\/([^/_.][^/]*)\//.exec(r);
    if (m) nombres.add(m[1]);
  }
  return {
    desplegar: locales.filter((n) => nombres.has(n)),
    borradas: [...nombres].filter((n) => !locales.includes(n)).sort(),
    todas: false,
  };
}

function borradasDe(cambiados, locales) {
  const nombres = new Set();
  for (const r of cambiados) {
    const m = /^supabase\/functions\/([^/_.][^/]*)\//.exec(r);
    if (m && !locales.includes(m[1])) nombres.add(m[1]);
  }
  return [...nombres].sort();
}

// ─── Config de Auth ──────────────────────────────────────────────────────────

/** Claves que ⊥ pueden vivir en el repo: son secretos. Van por el panel o por secrets del CI. */
const RE_CLAVE_SECRETA = /secret|_key$|token|smtp_pass|password_hcaptcha|client_id|api_key/i;

/**
 * Qué cambiar en la config de Auth del proyecto (`GET/PATCH /v1/projects/{ref}/config/auth`).
 *
 * Solo se tocan las claves DECLARADAS en `despliegue.json → auth`: lo que ⊥ está declarado se deja
 * como esté en el proyecto. Es config del PROYECTO entero ∴ en un proyecto compartido la declara UN
 * solo repo (el dueño de `plataforma`); dos repos declarando valores distintos se pisarían en cada
 * despliegue.
 *
 * @param {Record<string, unknown>} deseado
 * @param {Record<string, unknown>} actual
 * @returns {{ cambios: {clave:string, actual:unknown, deseado:unknown}[], desconocidas: string[], secretas: string[] }}
 */
export function planificarAuth(deseado, actual) {
  const claves = Object.keys(deseado).filter((k) => !k.startsWith("$") && k !== "porque");
  const secretas = claves.filter((k) => RE_CLAVE_SECRETA.test(k));
  // Una clave que el proyecto ⊥ tiene es casi seguro un typo: PATCH la ignoraría en silencio y el
  // plan diría «aplicado» sobre algo que ⊥ existe.
  const desconocidas = claves.filter((k) => !secretas.includes(k) && !(k in actual));
  const cambios = claves
    .filter((k) => !secretas.includes(k) && !desconocidas.includes(k))
    .filter((k) => JSON.stringify(actual[k]) !== JSON.stringify(deseado[k]))
    .map((k) => ({ clave: k, actual: actual[k], deseado: deseado[k] }));
  return { cambios, desconocidas, secretas };
}

// ─── Secretos ────────────────────────────────────────────────────────────────

/** Los que Supabase inyecta solo en toda function: ⊥ se declaran ni se setean. */
export const SECRETOS_DE_SUPABASE = new Set([
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
  "SUPABASE_JWKS",
  "SUPABASE_PUBLISHABLE_KEYS",
  "SUPABASE_SECRET_KEYS",
]);

/**
 * Los nombres que el código lee con `Deno.env.get('LITERAL')`.
 *
 * ⚠️ Es una cota INFERIOR: `Deno.env.get(nombre)` con variable ⊥ se ve. Por eso la fuente de verdad
 * es el manifiesto (`supabase/despliegue.json` → `secretos`) y esto solo verifica que ⊥ se quedó
 * atrás del código.
 * @param {string} dir  `supabase/functions`
 */
export function secretosLeidosEnCodigo(dir) {
  const nombres = new Set();
  const recorrer = (d) => {
    for (const n of readdirSync(d)) {
      const ruta = join(d, n);
      if (statSync(ruta).isDirectory()) {
        if (n !== "node_modules") recorrer(ruta);
      } else if (/\.(ts|js|mjs|tsx)$/.test(n) && !/\.test\./.test(n)) {
        const texto = readFileSync(ruta, "utf8");
        for (const m of texto.matchAll(/Deno\.env\.get\(\s*['"`]([A-Z0-9_]+)['"`]\s*\)/g)) {
          nombres.add(m[1]);
        }
      }
    }
  };
  if (existsSync(dir)) recorrer(dir);
  return nombres;
}

/**
 * @param {{requeridos?: string[], opcionales?: string[]}} manifiesto  `secretos` de `supabase/despliegue.json`
 * @param {Set<string>} enCodigo
 * @param {Set<string>|null} remotos  nombres seteados en el proyecto (null = ⊥ se pudo consultar)
 */
export function revisarSecretos(manifiesto, enCodigo, remotos) {
  const requeridos = manifiesto.requeridos ?? [];
  const declarados = new Set([
    ...requeridos,
    ...(manifiesto.opcionales ?? []),
    ...SECRETOS_DE_SUPABASE,
  ]);
  const sinDeclarar = [...enCodigo].filter((n) => !declarados.has(n)).sort();
  const faltan = remotos ? requeridos.filter((n) => !remotos.has(n)).sort() : [];
  return { sinDeclarar, faltan };
}
