---
name: cavekit-check
description: "Detecta desvíos entre SPEC.md, las tareas y el código: invariantes que no se cumplen, interfaces que cambiaron y tareas marcadas como hechas sin evidencia. Solo lectura, no modifica nada. Usala cuando el usuario pida verificar, revisar desvíos o ver el estado de la spec. NO usarla para corregir (cavekit-backprop o cavekit-build) ni para auditorías amplias de seguridad (cavekit-audit)."
allowed-tools: Read Grep Glob Bash(git status *) Bash(git log *) Bash(git show *)
---

# check — drift report

Pure diagnostic. Reports violations. Writes nothing.

## LOAD

1. Read `SPEC.md`.
2. Read all `.agents/tasks/YYYY-XXXX.md` files.
3. Parse invocation args:
   - `§V` → check global invariants (default)
   - `§I` → check interfaces
   - `tasks` → audit task files status vs code
   - `--all` → all three

## CHECK §V — invariants

For each V<n> in `SPEC.md` and task files:

1. Translate invariant into verifiable claim about code.
2. Grep / read relevant files.
3. Classify: **HOLD** / **VIOLATE** / **UNVERIFIABLE**.
4. Record address + file:line evidence.

## CHECK §I — interfaces

For each I item in `SPEC.md`:

1. Locate implementation.
2. Classify: **MATCH** / **DRIFT** / **MISSING** / **EXTRA**.

## CHECK tasks — .agents/tasks/

For each task file:

1. If `done`: verify claimed work present.
2. If `in_progress`: note status.
3. Flag `done` tasks with no evidence as **STALE**.

## REPORT

Caveman. Grouped by severity.

```
## global §V drift (SPEC.md)
V2 VIOLATE: auth/mw.go:47 uses `<` not `≤`.

## task drift (.agents/tasks/)
#2026-0007 HOLD: soft-delete logic present.
#2026-0008 VIOLATE: missing deleted_at check in query.

## summary
1 violate. 1 stale.
next: cavekit-spec `bug: <task ID>` (BACKPROP mode).
```

## NON-GOALS

- Zero writes. No SPEC.md or task edits.
- No auto-generating IDs.
