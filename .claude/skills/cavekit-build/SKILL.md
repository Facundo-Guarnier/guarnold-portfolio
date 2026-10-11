---
name: cavekit-build
description: "Implementa una tarea de .agents/tasks/YYYY-XXXX.md siguiendo planificar, ejecutar y verificar. Para tareas grandes el agente principal planifica y delega en subagentes implementador, verificador y revisor. Usala cuando el usuario pida implementar o continuar una tarea con ID explícito. NO usarla sin ID de tarea (pedirlo primero), para auditorías (cavekit-audit) ni para diagnosticar un fallo de CI (pr-fix)."
---

# build — implement task

Single-thread native plan→execute.

## LOAD

1. **CRITICAL: MANDATORY ID**: Check if the user explicitly provided a Task ID in the format `#YYYY-XXXX`.
2. **NO INFERENCE**: Never autogenerate, infer, or map IDs from any source.
3. **ASK AND WAIT**: If the ID is missing, you MUST ask the user: "¿Cuál es el ID de la tarea en la que trabajamos?" and WAIT for their response.
4. Read `.agents/tasks/YYYY-XXXX.md`.
5. Read `SPEC.md` for global §G, §V, §I context.
6. Load the `cavekit-spec-encoding` skill once if not loaded (compressed grammar; no `FORMAT.md` file exists).

## PLAN

1. Cite requirement from §R of task file.
2. Cite invariants from §V of task file and global §V from `SPEC.md`.
3. List files to create / edit.
4. List tests to add or update (one per invariant touched).
5. Name verification command (test, build, lint).

## MODO DE EJECUCIÓN

Se elige antes de empezar, según el tamaño de la tarea.

**Modo A, un hilo.** Para tareas chicas: unos pocos archivos, un módulo, sin partes independientes.
El agente principal hace todo el ciclo PLAN, EJECUTA, VERIFICA sin delegar.

**Modo B, planificador más implementadores.** Para tareas grandes: más de unos 5 archivos, más de un
módulo o partes independientes. Requiere los subagentes del repo en `.claude/agents/`:

- `implementador`: recibe un corte cerrado (archivos exactos, criterio de aceptación, invariantes a
  citar). Implementa solo ese corte, hace commit con pathspec y no toca §S de la tarea.
- `verificador`: corre tests, typecheck y lint sobre el corte y reporta la salida. No edita código.
- `revisor`: revisa el diff con contexto fresco, buscando romperlo. No edita código.

Reglas del modo B:

1. El agente principal escribe el plan con los cortes antes de delegar y es dueño de §S.
2. Los cortes independientes pueden ir en paralelo. Dos implementadores nunca tocan el mismo archivo.
3. Cada subagente devuelve un informe fijo: archivos tocados, hashes de commit, salida de verificación
   (con código de salida), dudas abiertas. Sin narrativa.
4. El principal valida cada informe antes de marcar `done`. No confía en un "pasó" sin la salida.
5. Un fallo sigue el mismo camino que en modo A: backprop antes de reintentar.
6. Si los subagentes no existen en el repo, se cae a modo A y se avisa al usuario.

## EXECUTE

1. APPEND row to §S STATUS: `- [YYYY-MM-DD] in_progress — <what starts>`. ⊥ overwrite prior rows.
2. Edit code per plan.
3. Run verification command.
4. **Pass, full scope** → APPEND `- [YYYY-MM-DD] done — <what closed>`. **Partial** (only part landed) → APPEND `- [YYYY-MM-DD] partial — done: <X>; falta: <Y>`; a later cycle appends the `done` row when the rest lands.
5. **Fail** → run backprop (see below). Do NOT retry blindly.

## FAIL → BACKPROP

On test/build failure:

1. Read failure output.
2. Ask: is failure (a) my code bug, (b) spec/task wrong, or (c) unspecified edge case?
3. If (a) → fix code, re-run. No task change.
4. If (b) or (c) → invoke `cavekit-spec` with `bug:` (its BACKPROP mode) to update task §B & invariants.

## WRITE POLICY

- Status changes ONLY in `.agents/tasks/YYYY-XXXX.md`.
- No `SPEC.md` edits from build (use `cavekit-spec` if needed).
- Commit after task completes. Message: `#YYYY-XXXX — <goal line>` + §V cites.

## VERIFICATION

Task `done` only if:
- Verification command exits 0.
- New test(s) added per plan.
- No global §V invariant regressed.

## NON-GOALS

- No auto-generating IDs.
- No editing `SPEC.md` for task status.
