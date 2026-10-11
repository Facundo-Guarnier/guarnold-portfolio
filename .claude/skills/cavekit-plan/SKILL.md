---
name: cavekit-plan
description: "Convierte una conversación de discovery (preguntas, respuestas y decisiones) en un plan de alto nivel en plans/NOMBRE-YYYY-MM.md. Va antes de cavekit-spec: el plan fija el qué y el porqué; las tareas, el cómo. Usala cuando el usuario cierre una ronda de discovery o pida documentar decisiones. NO usarla para escribir SPEC.md ni tareas (cavekit-spec) ni para escribir código."
---

# plan — discovery → actionable plan

Distill discovery (chat, `docs/PREGUNTAS-ABIERTAS.md`, notes) → plan in `plans/`.
El plan que se escribe es **prosa en español para personas y clientes**. La gramática comprimida (cavekit-spec-encoding) no aplica acá: solo a SPEC.md y tareas.

## CUÁNDO

- After discovery round (questions answered, decisions taken in chat).
- Need to fix WHAT + WHY before dropping to tasks.
- ⊥ for SPEC.md | `.agents/tasks/` → that's `cavekit-spec`.

## INPUT

- Current conversation (decisions, client answers, observations).
- Optional: Q&A doc (`docs/PREGUNTAS-ABIERTAS.md` | similar) in args.

## PROCESS

1. **Name + date**. Short UPPERCASE name from topic (e.g. `FLOTA-INTERNA`).
   File: `plans/NOMBRE-YYYY-MM.md`. Same-topic plan exists → check its state (last line of
   `## Bitácora de estado`): still `Vigente` → ask update-in-place | new plan superseding it;
   already `Completado`/`Superado` → new plan (old = immutable). ⊥ invent date: use real today.

2. **Verify vs code**. Every "app does X today" claim → confirm in repo (tables, cols, files)
   before writing. Plan starts from reality, ⊥ assumption. Use Explore/Grep if needed.

3. **Split closed vs open**:
   - Closed decision = client/team confirmed in convo → §2, ID `D#`.
   - Open question = fine design decision unresolved → §8, ID `O#`.
   - Tag [CLIENTE] (business) vs [TÉCNICA] (impl) when it applies.

4. **Capture ALL discussed**. Before closing, walk every discovery answer/observation, map
   each to a section. Nothing loose. Doesn't fit → §8 open, ⊥ discard.

5. **Write plan** w/ §PLANTILLA template.

6. **Update related specs** if discovery touched another spec/doc (e.g. roles → `docs/PBAC.txt`),
   marked "no implementado aún" if applies.

7. **⊥ implement**. Plan writes no code/migrations. Close offering to drop to Cavekit tasks
   (`cavekit-spec`) when user wants.

## PLANTILLA

Header (written ES — client reads it):

```
# Plan — <Título>

**Fecha:** YYYY-MM-DD
**Alcance:** <qué entra y qué queda afuera>
**Estado:** Vigente
**Origen:** <de dónde sale el discovery; ej. docs/PREGUNTAS-ABIERTAS.md>
```

Header written ONCE, ⊥ rewritten (plan = immutable). `Estado:` born `Vigente`.
Later state changes ⊥ touch header: APPEND to file end in `## Bitácora de estado`, one line
per transition:

```
## Bitácora de estado
> [YYYY-MM-DD] Vigente → Completado. <nota breve: tasks que lo implementaron, o motivo>
> [YYYY-MM-DD] Vigente → Superado por PLAN-<OTRO>-YYYY-MM. <por qué>
```

Canonical states:
- **Vigente** — active plan (not yet run | in progress). Initial state.
- **Completado** — full plan scope implemented.
- **Superado por PLAN-X** — replaced by new plan (which refs it back).
- **Descartado** — won't do; leave reason.

Live state = last bitácora line (| `Vigente` if no bitácora).

Sections (skip N/A, keep order):

1. **Resumen ejecutivo** — core changes, numbered list.
2. **Decisiones cerradas** — table `| # | Decisión | Detalle |`, IDs `D1, D2…`.
3. **Modelo de datos objetivo** — new tables/cols + changes; relations; key views/logic. Ref decisions (`[D#]`).
4. **Backlog detallado** — table `| # | Requisito | Notas |`, IDs per domain (`DOC1`, etc.).
5. **Detalle por entidad / atributos** — if applies.
6. **KPIs / métricas** — if applies.
7. **UI/UX** — **mandatory if the plan touches ANY screen.** ⊥ "if applies": that wording made it
   skipped in every real plan (measured 2026-09-23: 0 of 4 plans had it). Per screen:
   - **The 4 states**: what `loading`, `error`, `empty` & `data` show. `error` BEFORE `empty` —
     a failed query leaves `[]` like an empty one. `empty` says what's missing **& the action that
     fills it**. Use `src/components/estado/` 🔗 `tools/estado/`.
   - **What's NOT drawn**: pagination, permissions, filters, what's lost going back. The
     behavior a mockup ⊥ shows is the one that ⊥ gets built. 🔗 `docs/principles/design-workflow.md`.
   - **The flow**: screen → screen with **labeled** transitions ("taps Enter", ⊥ a bare "→"). A
     transition you can't label = a step ⊥ decided yet → §8 open question.
   - **Mobile**: what changes at 390 px. The width nobody looks at while writing.
   - **Where it'll be SEEN**: the flow-board story to build (`src/stories/`, 🔗 `tools/stories/`).
     The mockup IS that story over the real components — ⊥ a `prototypes/` folder to move later
     (🔗 `docs/principles/herramientas-en-silo.md`).
8. **Preguntas abiertas / decisiones de diseño pendientes** — table, IDs `O1, O2…` + impact.
9. **Fuera de alcance ahora (futuro)** — deferred, w/ why + where its spec lives.
10. **Secuencia sugerida de implementación** — ordered steps; note each step drops to Cavekit task + migration on exec.

## OUTPUT RULES

- Plan = clear ES prose + tables. **⊥ caveman.**
- "App today" claims always verified vs code.
- Stable IDs: `D#` decisions, `O#` open, domain prefixes in backlog.
- One file per plan in `plans/`.
- Explicit cross-refs (`[D#]`, `(ver §8 O5)`).

## NON-GOALS

- ⊥ write SPEC.md | `.agents/tasks/` (that's `cavekit-spec`).
- ⊥ write code | migrations.
- ⊥ invent decisions client didn't confirm → §8 open.
- ⊥ apply caveman to the plan.
