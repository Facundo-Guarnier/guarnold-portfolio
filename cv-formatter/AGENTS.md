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

## Desarrollo local (stack Docker propio)

Stack de Supabase **solo para este repo**, en Docker. ⊥ la nube: el script se niega a escribir
config que apunte a otro lado.

| Qué | Dónde / cómo |
|---|---|
| Puertos (bloque 54380-54389, el próximo libre de `guarnold-hub/PUERTOS.md`) | API **54381** · DB **54382** · shadow **54380** · Studio **54383** · SMTP (inbucket) **54384** · pooler **54389** (apagado) · analytics **54387** (apagado) |
| App en local | `npm run dev:docker` → `vite --mode docker` en **5177** (el de `vite.config.ts`) |
| Levantar + migrar | `npm run db:local` (idempotente). Con base limpia: `npm run db:local:reset` |
| Parar | `npm run db:local:parar` |
| Config de la app | `.env.docker.local`, **generado** por `db:local` (gitignoreado). Plantilla: `.env.docker.local.example` |
| Cuenta CON acceso | `con-acceso@ejemplo.com` / `cv-local-1234` (`tools/local/entorno.mjs`) |
| Cuenta SIN acceso | `sin-acceso@ejemplo.com` / `cv-local-1234` |
| Pruebas SQL | `npm run test:sql` (`supabase/tests/*.sql`, cada una en su transacción con ROLLBACK) |
| Integración (PostgREST + RLS real) | `npm run test:integracion` |
| E2E (Playwright, levanta el dev server en modo `docker`) | `npm run test:e2e` |
| Unitarios | `npm test` (⊥ necesita Docker) |

Notas:

- **`--mode local` ⊥ existe**: Vite lo rechaza (choca con el postfijo `.local` de los `.env`). El modo
  es `docker` (la convención de `tools/scripts/db-local.mjs`).
- **`db.migrations` está apagado** en `supabase/config.toml`: `plataforma` (`has_app_access`) vive en el
  repo de GuarNote y tiene que existir **antes** de las migraciones de acá. `preparar-stack.mjs` lee
  `../guarnote/supabase/migrations/20261002234342_plataforma_acceso_por_app.sql` (⊥ copia: dos copias
  divergen). Otro lugar: `GUARNOTE_REPO=/ruta`.
- **`supabase/roles.sql`** crea el esquema `cv-formatter` vacío al arrancar: PostgREST ⊥ arranca si
  un esquema de `api.schemas` ⊥ existe (503), y las migraciones corren después de la API.
- Las migraciones se registran en `supabase_migrations.schema_migrations` (la tabla del CLI), así que
  `db:local` aplica solo las nuevas. Una migración que ⊥ es idempotente sobre una base ya migrada
  (ej. `CREATE POLICY` sin `DROP`) ⊥ se puede reaplicar: por eso el registro.
- Las pruebas SQL vacían `profiles` dentro de su transacción (la RPC toma el primer perfil); el ROLLBACK
  devuelve el perfil del `db:local`.

### Importar el portfolio al editor

«Importar desde portfolio» (`components/editor/ImportarPortfolio.tsx`) toma el `content.yml` de
`guarnold-portfolio` y lo **mezcla en el estado sin guardar**: el owner revisa el resumen y aprieta
«Guardar». La lógica es pura (`lib/importarPortfolio.ts`, con tests en `lib/__tests__/`). Fixture:
`tests/fixtures/content.yml` (copia @ `f700f03`).

- Lo que trae el YAML pisa; lo que ⊥ existe se agrega con `enCv: false`. Los ítems se emparejan por
  nombre normalizado (sin paréntesis, sin tildes) o por `slug` en proyectos.
- **Foto**: `identity.avatar_url` es `/assets/profile.jpg`, un archivo del portfolio. Se guarda la ruta
  tal cual y el resumen avisa: en el CV ⊥ se ve hasta que la foto esté en una URL pública.
- `location.background_image` ⊥ tiene destino en la base: se omite con aviso.
