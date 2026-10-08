#!/usr/bin/env node
/**
 * promover-migracion.mjs — pasa un borrador probado a `supabase/migrations/` con su versión, en un
 * repo que despliega por CI (🔗 `MIGRATIONS.md` §Two roads, `docs/guides/despliegue-supabase.md`).
 *
 *   node tools/deploy/promover-migracion.mjs <desc>
 *
 * Mueve `supabase/migrations-draft/<desc>.sql` → `supabase/migrations/<UTC ahora>_<desc>.sql`. ⊥ la
 * aplica: la aplica el CI cuando el commit llega a `main`. Probala ANTES en el stack efímero.
 */

import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";
import { leerMigracionesLocales, nombreDePromocion } from "./plan-supabase.mjs";

const desc = process.argv[2]?.replace(/\.sql$/, "");
if (!desc) {
  console.error(
    "Uso: promover-migracion.mjs <desc>   (el borrador supabase/migrations-draft/<desc>.sql)",
  );
  process.exit(2);
}

const borrador = join("supabase", "migrations-draft", `${desc}.sql`);
if (!existsSync(borrador)) {
  console.error(`✖ ⊥ existe ${borrador}`);
  process.exit(1);
}

const dir = join("supabase", "migrations");
const { migraciones } = leerMigracionesLocales(dir);
if (migraciones.some((m) => m.nombre === desc)) {
  console.error(`✖ Ya hay una migración llamada ${desc} en ${dir}: elegí otra descripción.`);
  process.exit(1);
}

const destino = join(
  dir,
  nombreDePromocion(
    desc,
    new Date(),
    migraciones.map((m) => m.version),
  ),
);
renameSync(borrador, destino);
console.log(`✓ ${borrador} → ${destino}`);
console.log("  La aplica el CI al llegar a main. ⊥ la apliques a mano.");
