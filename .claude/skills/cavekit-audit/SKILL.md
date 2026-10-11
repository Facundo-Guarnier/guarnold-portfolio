---
name: cavekit-audit
description: "Audita en profundidad un dominio (seguridad, privacidad, rendimiento, accesibilidad o cumplimiento): arma un plan exhaustivo, lo revisa contra la app real y lo divide en tareas de solo análisis que escriben un único informe. El análisis largo corre en un subagente y solo vuelve el informe. Usala ante pedidos de auditoría o revisión amplia. NO usarla para una funcionalidad (cavekit-plan + cavekit-build), un bug puntual (cavekit-backprop) ni una revisión de un solo diff (code-review)."
allowed-tools: Read Grep Glob Bash(git log *) Bash(git status *)
---

# cavekit-audit — audit flow in 4 phases

Flow for broad audits (security, privacy, performance, accessibility, compliance, etc). Not for features. Does not modify app code: only produces a report.

## When to use

- User asks to "audit", "review security", "analyze privacy", "deep review", etc.
- Broad scope (many areas: DB, edge functions, frontend, storage, CI, legal…).
- Deliverable = document, not code.

## When NOT to use

- New feature → `cavekit-plan` + `cavekit-spec` + `cavekit-build`.
- Specific bug → `cavekit-build` directly.
- Refactor → normal plan.

---

## CÓMO SE REPARTE EL TRABAJO

El análisis de código es largo y llena el contexto. Por eso:

- El **inventario** del repo (fase 1) y la **revisión de cobertura** (fase 2) corren en un subagente
  de solo lectura (`relevador`, o un subagente dedicado del audit). Devuelve la lista de áreas con
  rutas, no el contenido de los archivos.
- Cada **sección del análisis** (fase 4) corre en su propio subagente con la tarea de esa sección como
  único encargo. El subagente escribe sus hallazgos y devuelve al contexto principal solo el resumen:
  conteo por severidad, top 3 riesgos y ruta de la sección escrita.
- El agente principal nunca carga el código completo de un área: el informe es el único producto que
  vuelve.

## PHASE 1 — EXHAUSTIVE PLAN

Goal: produce `plans/<topic>-YYYY-MM.md` covering ALL areas of the audited domain.

1. Ask the user:
   - Topic (security, privacy, perf…).
   - Scope (DB only? full-stack? include legal/compliance?).
   - Applicable legal/regulatory context (e.g. Ley 25.326 AR, GDPR, HIPAA).
2. Explore the repo with `rg` / `list_dir` to inventory real areas (tables, edge fns, buckets, routes, secrets, deps).
3. Write the plan in `plans/<topic>-YYYY-MM.md` with numbered sections §1…§N, one per area. Each section lists:
   - What to review (concrete checklist).
   - Suggested tools (`supabase--linter`, `rg`, `code--dependency_scan`, etc).
   - Typical risks of the area.
4. Show plan to user and request feedback.

## PHASE 2 — PLAN REVIEW

Goal: close gaps BEFORE creating tasks.

1. Re-read the plan asking explicitly: "is any area still uncovered?".
2. Cross-check coverage against the repo: are there tables / edge fns / buckets / routes / dependencies not touched by any §N?
3. Add missing sections. Confirm with user that the plan is "for analyzing", not "for fixing".
4. Tone check: each §N must be observable/verifiable, not prescriptive.

## PHASE 3 — ATOMIC TASKS

Goal: one task per §N section. NEVER a single giant umbrella task.

1. Ask user for ID range `#YYYY-XXXX → #YYYY-YYYY` (⊥ infer IDs).
2. Create coordination task `#YYYY-XXXX` that:
   - Lists the N sub-tasks in a table.
   - Defines coordination rules: user OK per section, finding format, mini summary at close.
   - ⊥ contains work of its own.
3. Create N atomic tasks `#YYYY-(XXXX+1)…#YYYY-(XXXX+N)`, one per §N. Each task has:
   - §R: requirement = "analyze §N, document findings, ⊥ fix".
   - §V: cite parent plan's §N + relevant global invariants.
   - §P: concrete process (area-specific tools).
   - §B: bugs (empty).
   - §S: `todo`.
   - **⊥ fix** policy: forbidden to touch app code during the task. Only write to the report.
4. Single deliverable: `docs/<topic>-YYYY-MM.md`. Each task writes ITS section into that file, does not create new files.

## PHASE 4 — EXECUTION

One task at a time, in the order agreed with the user.

1. Flip §S: `todo → in_progress`.
2. Execute §P with listed tools.
3. Write findings in the corresponding section of the single report. Per-finding format:
   - **Severity**: critical / high / medium / low / info.
   - **Status**: present / mitigated / n/a.
   - **Impact**: what breaks / what leaks.
   - **Recommendation**: what would be needed (without implementing).
   - **Estimated effort**: S / M / L.
   - **References**: `file:line`, table, policy, etc.
4. Section close: mini summary (count per severity, top 3 risks).
5. Ask user OK before moving to next task.
6. Flip §S: `in_progress → done` only after OK.

---

## HARD RULES

- ⊥ fix during the audit. No `sed`. No migration. Nothing.
- ⊥ umbrella tasks. One task = one section = one bounded scope.
- ⊥ auto-generating IDs. Ask for explicit range.
- ⊥ multiple deliverables. ONE report, N sections.
- ⊥ skipping Phase 2. Plan review is mandatory.

## EXPECTED OUTPUTS

```
plans/<topic>-YYYY-MM.md             # plan with §1..§N
.agents/tasks/YYYY-XXXX.md           # coordinator
.agents/tasks/YYYY-(XXXX+1..N).md    # one per §N
docs/<topic>-YYYY-MM.md              # single report, filled during Phase 4
```

## NON-GOALS

- Does not propose executable fixes. Only recommendations.
- Does not prioritize on its own: asks user for execution order.
- Does not close tasks without user OK.
