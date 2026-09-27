# Agent Context — cv-formatter

Online CV editor — create, edit and share a professional résumé.

**Stack:** React + Vite + TypeScript + Supabase
**Owner:** Personal

> ⚠️ Full methodology ⊥ installed here yet. Template: `guarnold-hub/base-proyectos/`.
> Until then, this file + `README.md` are the whole context of this repo.

## Hard rules (non-negotiable)

- **🚫 ⊥ `git push`. EVER.** Agent commits; the user pushes.
- Branches: `main` = stable/prod · `dev` = daily work (default). ⊥ commit straight to `main`.
- **Done = all 3, actually run (⊥ assumed):** build clean · lint clean (where configured) · tests green (where they exist).
  Fails → report the real output. ⊥ `--no-verify` to dodge a hook.
- **Supabase project is SHARED** ("Guarnold Main": guarnote, pivot, cv-formatter, ONE `auth.users`).
  Account ≠ cv-formatter access. Write policies = `plataforma.has_app_access('cv-formatter')`.
  🔴 ⊥ `auth.role() = 'authenticated'` as a write gate: it means "any account of ANY app" — that bug
  let every account edit the public CV. Model + playbook: `guarnold-hub/docs/acceso-por-app.md`.
- Non-trivial change → plan first. Touches DB, permissions, several files, or changes behavior → always.
- Verification agents (gap/contradiction hunting) are token-expensive → **ASK THE USER FIRST**.

## Context

- Lives in `D:/Repositorios_GitHub/personal/cv-formatter` — a container of 22 independent repos.
  The `AGENTS.md` at that root explains the whole setup.
- Owner's generic rules: `D:/Repositorios_GitHub/guarnold-hub/.claude/memory/` → start at `MEMORY.md`.
  Path ⊥ exists (other machine / external dev) → skip it, this file stands alone.
- What this project does → `README.md` here.
- Tasks, pendings, day-to-day state → **GuarNote** (the owner's own app). ⊥ invent TODOs in markdown.

## Learnings

Learning specific to THIS repo → document it HERE, versioned with the code.
Useful in ANY project → belongs in the hub, ⊥ here.
