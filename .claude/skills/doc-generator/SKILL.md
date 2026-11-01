---
name: doc-generator
description: "Extrae contexto técnico de src/ y supabase/migrations/ y escribe docs modulares en docs/tabs/ con hechos del código actual, sin bugs ni opiniones. Usala con /doc-generator <ruta> o cuando falte documentación de un módulo. NO usarla para escribir guías de proceso ni para documentar algo que todavía no existe en el código."
---

# doc-generator — Context Extractor

Explore code. Distill architecture. Write granular docs. ⊥ noise.

## Dispatch

Trigger: `/doc-generator <path>`.
Scope: `src/` + `supabase/migrations/`.
Check: `docs/INDEX.md` ! exist.

## Steps

### 1. Analyze
Map components & persistence:
- Data: Tables, views, RPC signatures `rpc("fn", {args})`.
- Logic: Hooks, context, `useState`/`useReducer`.
- UI: Hierarchy & key props.
⊥ Bugs/gaps in `docs/tabs/`. ∴ Move to `issues/uxui_report.md`.

### 2. Write
Path: `docs/tabs/<feature>/`.
- Size: Small files. Single focus.
- Purity: Happy paths & current arch. ⊥ TODOs/Bugs.
- Content: H1 → Data/State → Flows (Action → Reaction).

### 3. Register
Update `docs/INDEX.md`. Keep categories.
Format: `- docs/path: [Description]`.

## Output
⊥ Sub-agents. ⊥ Opinion. Only technical facts.
