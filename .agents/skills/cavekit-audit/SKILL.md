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

Tasks live in GuarNote, created with its MCP (`create_task`); the base assigns the IDs (⊥ ask for or
invent a range). Section mapping: `docs/guides/tareas-en-guarnote.md`. MCP unavailable → tell the
owner and stop.

1. Confirm with the user the list of N sections that become tasks.
2. Create the coordination task first (`create_task`) that:
   - Lists the N sub-tasks in a table.
   - Defines coordination rules: user OK per section, finding format, mini summary at close.
   - ⊥ contains work of its own.
3. Create N atomic tasks, one per §N. Each task has:
   - `content` §R: requirement = "analyze §N, document findings, ⊥ fix".
   - `content` §V: cite parent plan's §N + relevant global invariants.
   - `content` §P: concrete process (area-specific tools).
   - `details.acceptance_criteria`: the section of the report is written, each finding in the format below.
   - `details.references`: the plan and the coordination task (`#AAAA-XXXX`).
   - `status: "todo"` + comment `todo — creada`.
   - **⊥ fix** policy: forbidden to touch app code during the task. Only write to the report.
   Then update the coordination task's table with the N task numbers the base returned.
4. Single deliverable: `docs/<topic>-YYYY-MM.md`. Each task writes ITS section into that file, does not create new files.

## PHASE 4 — EXECUTION

One task at a time, in the order agreed with the user.

1. `update_task` → `status: "doing"` + comment `in_progress — <section>`.
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
6. `status: "done"` + comment `done — <mini summary>` only after OK.

---

## HARD RULES

- ⊥ fix during the audit. No `sed`. No migration. Nothing.
- ⊥ umbrella tasks. One task = one section = one bounded scope.
- ⊥ inventing IDs: the base assigns them (`create_task`).
- ⊥ multiple deliverables. ONE report, N sections.
- ⊥ skipping Phase 2. Plan review is mandatory.

## EXPECTED OUTPUTS

```
plans/<topic>-YYYY-MM.md             # plan with §1..§N
GuarNote: 1 coordination task         # table of the N tasks
GuarNote: N tasks                     # one per §N
docs/<topic>-YYYY-MM.md              # single report, filled during Phase 4
```

## NON-GOALS

- Does not propose executable fixes. Only recommendations.
- Does not prioritize on its own: asks user for execution order.
- Does not close tasks without user OK.
