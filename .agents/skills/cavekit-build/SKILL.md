---
name: cavekit-build
description: "Implementa una tarea de GuarNote (#AAAA-XXXX, leída por su MCP) siguiendo planificar, ejecutar y verificar, y lleva su estado y sus criterios de aceptación. Para tareas grandes el agente principal planifica y delega en subagentes implementador, verificador y revisor. Usala cuando el usuario pida implementar o continuar una tarea con ID explícito. NO usarla sin ID de tarea (pedirlo primero), para auditorías (cavekit-audit) ni para diagnosticar un fallo de CI (pr-fix)."
---

# build — implement task

Single-thread native plan→execute. La tarea vive en GuarNote: se lee y se actualiza con su MCP
(`get_task`, `update_task`, `add_task_comment`). Mapeo de secciones y estados:
`docs/guides/tareas-en-guarnote.md`.

## LOAD

1. **CRITICAL: MANDATORY ID**: the user must name the task, as `#AAAA-XXXX` (task_number = the last four digits) or as a task just created in this session.
2. **NO INFERENCE**: never pick a task by inference. If the ID is missing, run `list_tasks` with the pending statuses (`["planning","todo","doing","qa"]`), show them, ask "¿Cuál es el ID de la tarea en la que trabajamos?" and WAIT.
3. `get_task` with that `task_number` → `content` (§R, §V, §P), `details` (criteria, errors, considerations, references) and comments (the status history).
4. Task `done` or `canceled` → it's closed and immutable. Stop and ask: new work on it is a new task (`cavekit-spec`).
5. Read `SPEC.md` for global §G, §V, §I context.
6. Load the `cavekit-spec-encoding` skill once if not loaded.
7. MCP unavailable → tell the owner and stop. ⊥ work from a local file.

## PLAN

1. Cite requirement from §R of the task.
2. Cite invariants from §V of the task and global §V from `SPEC.md`.
3. List files to create / edit.
4. List tests to add or update (one per invariant touched, one per acceptance criterion that is testable).
5. Name verification command (test, build, lint).

## MODO DE EJECUCIÓN

Se elige antes de empezar, según el tamaño de la tarea.

**Modo A, un hilo.** Para tareas chicas: unos pocos archivos, un módulo, sin partes independientes.
El agente principal hace todo el ciclo PLAN, EJECUTA, VERIFICA sin delegar.

**Modo B, planificador más implementadores.** Para tareas grandes: más de unos 5 archivos, más de un
módulo o partes independientes. Requiere los subagentes del repo en `.claude/agents/`:

- `implementador`: recibe un corte cerrado (archivos exactos, criterio de aceptación, invariantes a
  citar). Implementa solo ese corte, hace commit con pathspec y no toca el estado de la tarea.
- `verificador`: corre tests, typecheck y lint sobre el corte y reporta la salida. No edita código.
- `revisor`: revisa el diff con contexto fresco, buscando romperlo. No edita código.

Reglas del modo B:

1. El agente principal escribe el plan con los cortes antes de delegar y es el único que escribe en
   la tarea de GuarNote (estado, criterios, comentarios).
2. Los cortes independientes pueden ir en paralelo. Dos implementadores nunca tocan el mismo archivo.
3. Cada subagente devuelve un informe fijo: archivos tocados, hashes de commit, salida de verificación
   (con código de salida), dudas abiertas. Sin narrativa.
4. El principal valida cada informe antes de marcar `done`. No confía en un "pasó" sin la salida.
5. Un fallo sigue el mismo camino que en modo A: backprop antes de reintentar.
6. Si los subagentes no existen en el repo, se cae a modo A y se avisa al usuario.

## EXECUTE

1. `update_task` → `status: "doing"` + `add_task_comment`: `in_progress — <what starts>`.
2. Edit code per plan.
3. Run verification command.
4. **Pass, full scope** → tick the criteria that now hold (`update_task` with the full
   `acceptance_criteria`, `done: true` only with evidence), add the commit/PR to `references`,
   `status: "done"` (or `"qa"` if the owner must try it first), comment `done — <what closed>`.
   **Partial** (only part landed) → tick what holds, keep `doing`, comment
   `partial — hecho: <X>; falta: <Y>`; a later cycle closes it.
5. **Fail** → run backprop (see below). Do NOT retry blindly.

## FAIL → BACKPROP

On test/build failure:

1. Read failure output.
2. Ask: is failure (a) my code bug, (b) spec/task wrong, or (c) unspecified edge case?
3. If (a) → fix code, re-run. No task change.
4. If (b) or (c) → invoke `cavekit-spec` with `bug:` (its BACKPROP mode) to update `details.errors` & invariants.

## WRITE POLICY

- Task state ONLY in GuarNote: `status`, ticked criteria, `references`, comments. Comments are append-only.
- ⊥ edit the task's `content` (§R, §V, §P) from build: that's `cavekit-spec` (AMEND).
- No `SPEC.md` edits from build (use `cavekit-spec` if needed).
- Commit after task completes. Message: `#AAAA-XXXX — <goal line>` + §V cites.

## VERIFICATION

Task `done` only if:
- Verification command exits 0.
- New test(s) added per plan.
- Every acceptance criterion is ticked with evidence (or the task stays `partial`).
- No global §V invariant regressed.

## Antes de decir listo

Coherente con la definición de "listo" de `docs/reglas-de-trabajo.md` (§4). Antes de decir que una
tarea está terminada, el informe tiene que traer esta evidencia:

1. **Salida real** de typecheck, lint, tests y build, con su código de salida. Lo que el repo no
   tiene configurado se dice explícitamente ("no hay lint configurado"); no se omite en silencio.
2. **Qué se verificó a mano**: el flujo recorrido en la app o el caso borde probado, con el paso
   exacto.
3. **Qué no se pudo verificar** y por qué (sin entorno, sin credenciales, prod es de solo lectura).
   Esto va en el informe igual que lo verificado.
4. **Cambios de DB, permisos o comportamiento**: verificación en la app real o en la base efímera,
   no solo que el build pase.

Sin esa evidencia no se usan las palabras "listo", "funciona" ni "pasa". Un informe de subagente
que dice "pasó" no cuenta como evidencia: se revisa su salida antes de marcar `done`.

Adaptado de obra/superpowers (MIT), commit bb92a77741419a4ab5f06e711a283343f1ada0c3.

## NON-GOALS

- No auto-generating or inferring task IDs.
- No editing `SPEC.md` for task status.
- No task files in `.agents/tasks/`.
