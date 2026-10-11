---
name: cavekit-spec
description: "Crea o edita SPEC.md y las tareas .agents/tasks/YYYY-XXXX.md: distilla un proyecto nuevo, agrega una tarea, extrae la spec del código o enmienda un invariante. Es el único que modifica spec y tareas. Usala cuando el usuario pida una tarea nueva, una spec o cambiar un criterio. NO usarla para implementar código (cavekit-build) ni para registrar un bug con causa (cavekit-backprop)."
---

# spec — spec & task mutator

Load the `cavekit-spec-encoding` skill (compressed grammar) if not already loaded — it applies to all spec/task writes. Task structure = `.agents/tasks/_TEMPLATE.md`. (No `FORMAT.md` file exists; the grammar lives in that skill.)

## DISPATCH

Inspect user request and project state:

1. No `SPEC.md` at repo root AND args describe idea → **NEW_PROJECT**
2. `SPEC.md` exists AND args describe new feature/task → **NEW_TASK** (local ID) or **NEW_TASK_MCP**
   (ID de la base) — ver "ID: local vs MCP" antes de elegir.
3. `SPEC.md` exists AND `from-code` in args → **DISTILL**
4. `SPEC.md` exists AND args start `bug:` → **BACKPROP** (update task §B + SPEC §V — see §BACKPROP below)
5. `SPEC.md` exists AND args start `amend` → **AMEND**
6. `SPEC.md` exists, no args → ask user which mode

## NEW_PROJECT — idea → spec

Input: user idea.

Steps:
1. Extraer el objetivo (una línea, en gramática de spec). → §G.
2. List constraints user stated or implied. → §C.
3. List external surfaces user named. → §I.
4. Propose initial invariants. → §V (numbered V1…).
5. Write to `SPEC.md`. NO §T ni §B sections.
6. Invoke **NEW_TASK** for each initial task.

## NEW_TASK — feature/goal → task file

Input: task description.

Steps:
1. **CRITICAL: MANDATORY ID**: Check if the user explicitly provided a Task ID in the format `#YYYY-XXXX`.
2. **NO INFERENCE**: Never autogenerate, infer, or map IDs from any source (previous tasks, dates, etc.).
3. **ASK AND WAIT**: If the ID is missing, you MUST ask the user: "¿Cuál es el ID de la tarea?" and WAIT for their response before creating any file.
4. Create `.agents/tasks/YYYY-XXXX.md` ONLY after receiving the explicit ID.
3. Structure:
   # #YYYY-XXXX — <name>
   ## §R REQUIREMENT
   ## §V CITES (relevant invariants from SPEC.md)
   ## §P PROCESS
   ## §B BUGS (empty)
   ## §S STATUS (append-only dated log; seed row `- [YYYY-MM-DD] todo — creada`)

## ID: local vs MCP (Tarea #2026-0080)

Dos vías para el mismo problema — "¿quién reparte el número de tarea?" — y **conviven a
propósito**, ⊥ una reemplaza a la otra todavía:

| | **NEW_TASK (local)** | **NEW_TASK_MCP** |
|---|---|---|
| ID lo asigna | el usuario, a mano | `guarnote.tasks.task_number` (secuencia Postgres) |
| Dónde vive | `.agents/tasks/YYYY-XXXX.md` (archivo, este repo) | fila en `guarnote.tasks` (base, cross-rama) |
| Colisión entre ramas/agentes en paralelo | **posible** — es el bug que motiva esta fila de la tabla | **imposible por construcción** — una secuencia ⊥ reparte el mismo número dos veces |
| Cuándo usarla | repo sin proyecto GuarNote configurado, o se quiere el archivo Markdown versionado en git | hay un PAT MCP de GuarNote activo para este repo (`.mcp.json` / config del cliente) y de verdad importa que el número ⊥ choque |

**Ninguna de las dos es la obligatoria.** Preguntar al usuario cuál quiere si no lo dijo, igual que
ya se pregunta el ID en NEW_TASK. Ver `.agents/skills/db-new-migrations` para cómo se referencia
`gn-mcp-server` en general — acá solo importa la tool `create_task`.

## NEW_TASK_MCP — feature/goal → tarea en GuarNote via MCP

Input: task description. Precondición: un servidor MCP `guarnote` configurado y autenticado (PAT
`gnmcp_...`, emitido por `POST .../gn-mcp-server/issue-token` — ver JSDoc de
`supabase/functions/gn-mcp-server/index.ts`). Si no está configurado, caer a **NEW_TASK**.

Steps:
1. Llamar la tool `create_task` (servidor MCP `guarnote`) con `title` (obligatorio) y,
   opcionalmente, `content`, `status`, `priority`, `kind`.
   - `kind`: `"human"` o `"technical"`. **Default en esta tool: `"technical"`** — quien llama es
     un agente de IA, que es exactamente el caso que `kind` existe para distinguir (Tarea
     #2026-0080, `guarnote.tasks.kind`). Usar `"human"` solo si la tarea se crea EN NOMBRE de una
     persona (transcribiendo un pedido suyo) y debe verse como tal en el tablero.
   - ⊥ enviar `project_id`: el token ya lo fija (un PAT = un proyecto). Enviarlo no tiene efecto —
     la tool lo ignora y usa el del token, por diseño (ver JSDoc "Decision de diseño 2" del
     servidor).
2. La respuesta trae `task_number` — YA asignado y único, sin coordinación manual. Usarlo tal cual
   para referirse a la tarea (`Tarea #<task_number>`), ⊥ inventar un año-serial como en el ID local.
3. **⊥ crear además un archivo `.agents/tasks/`** para esta misma tarea — la fila en la base ES el
   registro. Si además hace falta una tarea LOCAL espejada (por ejemplo, para que quede como
   Markdown versionado y navegable en el repo), es una decisión aparte y explícita, ⊥ un paso
   automático de este flujo.
4. §R/§V/§P/§B/§S siguen siendo la forma de PENSAR y comunicar la tarea — van en el campo
   `content` de `create_task` (Markdown), con la misma estructura que `_TEMPLATE.md` salvo el
   encabezado `# #YYYY-XXXX — <título>`, que acá no aplica (no hay año-serial que inventar).
5. Para retomarla: `list_tasks` (filtra por `status` y/o `kind`) y `update_task` con el `task_id`
   (UUID) que devolvió `create_task`.

## DISTILL — code → spec

Walk repo. Produce §G, §C, §I, §V in `SPEC.md`.
For tasks, ask user IDs before creating `.agents/tasks/` files.

## BACKPROP — bug → task §B + SPEC §V

Update §B in the **active task file** and §V in `SPEC.md` if needed.
If no active task, ask for ID.

## AMEND — targeted edit

Input: `amend §V.3` (SPEC.md) or `amend #YYYY-XXXX` (task file).

## OUTPUT RULES

- Formato de SPEC.md y tareas según la skill `cavekit-spec-encoding`.
- Tasks (local): `.agents/tasks/YYYY-XXXX.md`.
- Tasks (MCP): fila en `guarnote.tasks`, vía la tool `create_task` — sin archivo local espejado
  por defecto (ver NEW_TASK_MCP).
- Spec: `SPEC.md`.
- No §T or §B in `SPEC.md`.
- IDs: `#YYYY-XXXX` (local) o el `task_number` que devuelve la base (MCP) — nunca mezclar los dos
  formatos para la MISMA tarea.

## NON-GOALS

- No auto-generating **local** IDs (NEW_TASK). El `task_number` de NEW_TASK_MCP sí lo genera la
  base — ese es el punto de esa vía, ⊥ una excepción a escondidas de esta regla.
- No editing `SPEC.md` for task/bug lists.
