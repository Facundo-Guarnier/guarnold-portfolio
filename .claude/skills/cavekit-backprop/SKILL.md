---
name: cavekit-backprop
description: "Registra un bug con su causa: encuentra el error, rastrea la causa raíz, lo anota en §B de la tarea y agrega un invariante §V a SPEC.md si la regla es general. Usala ante un fallo de test en verificación, un reporte de bug o un incidente en producción. NO usarla para implementar una tarea nueva (cavekit-build) ni para un desvío sin bug (cavekit-check)."
---

# backprop — bug → task §B + SPEC §V

SDD fixes the code AND edits spec/task so recurrence is impossible.

## WHEN TO BACKPROP

- Test failed at `/build` verification.
- User reports bug.
- Post-mortem after production incident.
- `/check` flags VIOLATE with root cause found.

## SIX STEPS

### 1. TRACE
Read failure output / bug report.
Find exact file:line of wrong behavior.
Name root cause in one caveman sentence.

### 2. ANALYZE
- Would a new §V invariant in `SPEC.md` catch this class? (preferred)
- Is task §R wrong?
- Is active task §B the right place to log this?

### 3. PROPOSE
1. **CRITICAL: MANDATORY ID**: Check if the user explicitly provided a Task ID in the format `#YYYY-XXXX`.
2. **NO INFERENCE**: Never autogenerate, infer, or map IDs from any source.
3. **ASK AND WAIT**: If the ID is missing, you MUST ask the user: "¿Cuál es el ID de la tarea activa?" and WAIT for their response.

Draft the change:
- §B entry in `.agents/tasks/YYYY-XXXX.md`.
- §V entry in `SPEC.md` if it's a general rule.

### 4. GENERATE TEST
Add failing test first. Name it citing the invariant or task ID.

### 5. VERIFY
Fix code. Run test. Must pass.

### 6. LOG
Commit task edit + spec edit + test + fix.
Commit msg: `#YYYY-XXXX — backprop §B: <cause>`.

## OUTPUT SHAPE

Every backprop run produces:
1. §B entry in `.agents/tasks/YYYY-XXXX.md`.
2. §V entry in `SPEC.md` (if new rule).
3. Test file.
4. Code fix.

NO writing to §B in `SPEC.md`.
