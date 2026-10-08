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
- **Prod deploy = the CI** (`desplegar-supabase.yml`, on merge to `main`): ⊥ `supabase db push`, ⊥ by hand.
  Config: `supabase/despliegue.json`. Plan locally: `SUPABASE_DEPLOY_DB=docker:supabase_db_guarnote node tools/deploy/desplegar-supabase.mjs --plan`.
  Migrations = `<14 digits>_<name>.sql`. The first one is `20260115000436_…` (renamed from `20260114_…`: that is
  the version prod has it registered under; ⊥ compared against prod's SQL — no access).
- Access per app: `"cv-formatter".tengo_acceso()` + `SinAcceso` screen (UX only; policies are the rule).
  SQL test: `(echo 'BEGIN;'; cat supabase/migrations/*.sql supabase/tests/tengo_acceso.sql) | docker exec -i supabase_db_guarnote psql -U postgres -q -v ON_ERROR_STOP=1`.
- Session: Guarnold ID mode turns on by DOMAIN (`*.guarnold.com.ar`, `lib/sesionCentral.ts`); elsewhere own login.
  ⊥ use `supabase.auth` outside `lib/auth.ts`.
- Tailwind is COMPILED (⊥ CDN): the CSP in `public/_headers` forbids third-party scripts. `npm run verificar:headers`.
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
