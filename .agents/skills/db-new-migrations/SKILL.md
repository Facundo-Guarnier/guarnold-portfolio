---
name: db-new-migrations
description: "Crea y aplica migraciones atómicas de Supabase vía MCP: escribe el borrador, lo aplica con el wrapper, que le asigna el nombre con la versión. Usala cuando haya que cambiar el esquema de un proyecto sin usuarios. NO usarla si la app ya tiene usuarios en producción (ahí va promover-migracion y CI), ni para cambiar datos (eso no es DDL), ni para editar una migración ya aplicada."
---

# db-new-migrations — Atomic DDL

Cambios de esquema seguros. El wrapper del MCP (`tools/mcp/supabase/supabase-mcp-wrapper.cjs`)
hace cumplir casi todo esto por código, ⊥ por disciplina.

## Las 2 carpetas

| Carpeta | Significa |
|---|---|
| `supabase/migrations-draft/<desc>.sql` | escrita, **⊥ aplicada** |
| `supabase/migrations/<version>_<desc>.sql` | **aplicada**. El nombre ES el `version` real |

Un borrador que quedó ahí = un cambio que se creyó aplicado y ⊥ lo está. Visible por construcción.

## 🔴 Antes: ¿la app ya tiene usuarios?

Si la app está **en uso** (o el proyecto es compartido con una que lo está), **este workflow ⊥
aplica**: ⊥ `apply_migration` contra la nube. El camino es:

1. Escribir el borrador (igual que abajo, paso 1) y probarlo en el **stack efímero de Docker**.
2. `node tools/deploy/promover-migracion.mjs <desc>` → pasa a `migrations/` con la hora UTC.
3. Commit. La aplica **el CI** cuando llega a `main` (`desplegar-supabase.yml`).

🔗 `MIGRATIONS.md` §Two roads · `docs/guides/despliegue-supabase.md`. Lo de abajo es para un
proyecto sin usuarios, donde dev ES el único proyecto.

## Workflow

1. **Escribir** `supabase/migrations-draft/<desc>.sql`.
   `<desc>` = snake_case, empieza con letra: `add_user_settings`, `fix_rls_projects`.
   **⊥ timestamp.** ⊥ existe script de nombres. El timestamp lo asigna el servidor.
2. **Aplicar**: `apply_migration(name: "<desc>")` — solo la descripción, sin `.sql`.
   El wrapper lee el archivo e inyecta su contenido ∴ lo aplicado ≡ lo versionado.
3. **Leer la respuesta.** Trae el nombre definitivo. Usar **ese** de ahí en adelante.

## Si falla

**El borrador queda INTACTO.** La respuesta indica la línea que falló cuando Postgres la informa.

- ✅ Corregir **solo eso** en el mismo archivo y reintentar con el **mismo** `<desc>`.
- ⊥ crear un archivo nuevo. ⊥ reescribir la migración entera. ⊥ cambiar el nombre.

Ese es el motivo de que el archivo se escriba antes de aplicar: para tener dónde corregir.

## Reglas (el wrapper bloquea si ⊥ se cumplen)

- **⊥ DDL por `execute_sql`.** Solo migración. `execute_sql` = datos.
- **Idempotente**: `IF EXISTS` / `IF NOT EXISTS`. Función → `CREATE OR REPLACE`.
- Tabla nueva → `ENABLE ROW LEVEL SECURITY`.
- **⊥ esquemas reservados**: `auth`, `storage`, `realtime`, `supabase_functions`, `vault`.
- **⊥ editar una migración ya aplicada** (ya está en `migrations/`). Cambio → borrador nuevo.
  Excepción: una migración vieja que impide levantar un entorno limpio — ver
  `docs/guides/supabase-local-dev.md`.
- **⊥ inventar timestamps.** Con este flujo es imposible: nunca escribís uno.

## Trigger

Hace falta un cambio de esquema (build o pedido manual).
