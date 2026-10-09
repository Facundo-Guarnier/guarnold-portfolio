# Agent Context — guarnold-portfolio

Sitio personal de Guarnold en **una sola app**: el portfolio (`/`), el CV público (`/cv`) y el editor
del CV (`/admin`). Lo que antes era `cv-formatter` vive acá, en `src/cv/`.

**Stack:** React 19 + Vite + TypeScript + Tailwind (compilado) + Supabase
**Owner:** Personal

> ⚠️ Full methodology ⊥ installed here yet. Template: `guarnold-hub/base-proyectos/`.
> Until then, this file + `README.md` are the whole context of this repo.

## Hard rules (non-negotiable)

- **🚫 ⊥ `git push`. EVER.** Agent commits; the user pushes.
- Branches: `main` = stable/prod · `dev` = daily work (default). ⊥ commit straight to `main`.
- **Done = all 3, actually run (⊥ assumed):** build clean · lint clean (where configured) · tests green (where they exist).
  Fails → report the real output. ⊥ `--no-verify` to dodge a hook.
- **Supabase project is SHARED** ("Guarnold Main": guarnote, pivot, este repo, ONE `auth.users`).
  Account ≠ app access. Write policies = `plataforma.has_app_access('cv-formatter')`.
  🔴 ⊥ `auth.role() = 'authenticated'` as a write gate: it means "any account of ANY app" — that bug
  let every account edit the public CV. Model + playbook: `guarnold-hub/docs/acceso-por-app.md`.
- **El esquema y el id de app se llaman `cv-formatter`** (`src/lib/supabase.ts`, `tengo_acceso()`, las
  policies). ⊥ renombrar: la base es compartida y el nombre quedó en prod. El nombre del repo es el único
  que cambió.
- **Prod deploy = the CI** (`.github/workflows/desplegar-supabase.yml`, on merge to `main`): ⊥ `supabase db push`, ⊥ by hand.
  Config: `supabase/despliegue.json`. Plan locally: `SUPABASE_DEPLOY_DB=docker:supabase_db_guarnote node tools/deploy/desplegar-supabase.mjs --plan`.
  Migrations = `<14 digits>_<name>.sql`. The first one is `20260115000436_…` (renamed from `20260114_…`: that is
  the version prod has it registered under; ⊥ compared against prod's SQL — no access).
- Access per app: `"cv-formatter".tengo_acceso()` + `SinAcceso` screen (UX only; policies are the rule).
  SQL test: `npm run test:sql` (corre cada `supabase/tests/*.sql` en su transacción con ROLLBACK).
- **Sesión:** Guarnold ID mode turns on by DOMAIN: `guarnold.com.ar` (apex) **y** `*.guarnold.com.ar`
  (`src/lib/sesionCentral.ts`, `esDominioGuarnold`). Elsewhere, login propio en `/login`.
  ⊥ use `supabase.auth` outside `src/cv/lib/auth.ts`.
- **Un solo cliente Supabase** (`src/lib/supabase.ts`) para todo. ⊥ crear un segundo `createClient` con sesión:
  dos GoTrue con la misma `storageKey` se pisan (supabase-js avisa «Multiple GoTrueClient instances»).
- **Token de la cuenta central solo en las rutas del editor** (`/admin`, `/editor`, `/login`). En el resto
  (portfolio, `/cv`) el cliente va como anónimo: si no, cada visita pegaría a `id.guarnold.com.ar`.
- Tailwind is COMPILED (⊥ CDN): the CSP in `public/_headers` forbids third-party scripts. `npm run verificar:headers`.
- Non-trivial change → plan first. Touches DB, permissions, several files, or changes behavior → always.
- Verification agents (gap/contradiction hunting) are token-expensive → **ASK THE USER FIRST**.

## Estructura

| Dónde | Qué |
|---|---|
| `src/` | El portfolio (Material You, `ThemeContext`; enrutado con `BrowserRouter`, antes `HashRouter`) |
| `src/cv/` | El CV: `pages/` (Home = `/cv`, Admin, Login), `components/`, `hooks/`, `lib/`, `types/`, `CvShell.tsx` |
| `src/lib/` | Lo compartido: cliente Supabase único, sesión central (`sesion-compartida.mjs`), enlaces `#/` viejos |
| `src/data/content.yml` | Respaldo del portfolio, y **también** lo importa el editor («Usar el portfolio de este sitio») |
| `supabase/` | Migraciones, `config.toml` (stack local), `roles.sql`, `tests/*.sql`, `despliegue.json` |
| `tools/` | `deploy/` (CI de Supabase), `headers/` (verificador de CSP), `local/` (stack Docker), `mcp/`, `scripts/` |
| `tests/integracion/` | PostgREST + RLS contra el stack local (`npm run test:integracion`) |
| `e2e/` | `portfolio-*.spec.ts` (puerto 3001, Supabase falso) · `cv-*.spec.ts` (puerto 5177, stack local) |
| `public/_headers`, `public/_redirects` | CSP/cabeceras de Netlify · SPA fallback `/* /index.html 200` |

**Alias:** `@/` = `src/`. Los módulos del CV importan `@/cv/...` y lo compartido `@/lib/...`.

## Rutas

- `/` `/trajectory` `/projects`: portfolio. `/cv`: CV público. `/admin` y `/editor`: editor. `/login`: login propio.
- Enlaces viejos `…/#/projects` se reescriben a `/projects` antes de montar (`index.tsx`, `src/lib/hashLegado.ts`).
- Ruta desconocida → `/` (catch-all del portfolio).
- El CV y el editor se cargan en diferido (`React.lazy` en `src/App.tsx`).
- `CvShell` pone `cv-activo` en `<body>`: los estilos globales de impresión/fondo del CV (`src/cv/cv.css`) van
  acotados a esa clase. ⊥ agregar un selector global (`body`, `html`, `*`, `section`) sin ese prefijo.
- Volver del login central: `volver` = `${origin}/admin`. El apex `https://guarnold.com.ar` **tiene que estar** en
  los orígenes permitidos de Guarnold ID (`plataforma.configuracion`, «Ajustes»).

## Context

- Lives in `D:/Repositorios_GitHub/personal/guarnold-portfolio` — a container of independent repos.
  The `AGENTS.md` at that root explains the whole setup.
- Owner's generic rules: `D:/Repositorios_GitHub/guarnold-hub/.claude/memory/` → start at `MEMORY.md`.
  Path ⊥ exists (other machine / external dev) → skip it, this file stands alone.
- What this project does → `README.md` here.
- Tasks, pendings, day-to-day state → **GuarNote** (the owner's own app). ⊥ invent TODOs in markdown.

## Desarrollo local

| Qué | Dónde / cómo |
|---|---|
| Puertos del portfolio (dev) | **3001** (`npm run dev`) — el default vive en `vite.config.ts` |
| Base compartida (dev, lo local ⊥ apunta a prod) | `npm run dev` (3001) lee `.env.development`: base de guarnold-id (`127.0.0.1:54391`, esquema `cv-formatter`). Previo: `npm run db:compartido` en `../guarnold-id` |
| Cuenta local (Guarnold ID en `localhost:5170`) | `npm run dev:cuenta` (modo `cuentalocal`, `.env.cuentalocal`) + `npm run dev` en `../guarnold-id` |
| Puerto de la app con stack local | **5177** (`npm run dev:docker` → `vite --mode docker`) |
| E2E del portfolio | **3001**, con Supabase falso por variables de entorno (sin Docker) |
| E2E del CV | **5177**, `vite --mode docker` contra el stack local (necesita `db:local`) |
| Stack Supabase local (bloque 54380-54389, `guarnold-hub/PUERTOS.md`) | API **54381** · DB **54382** · shadow **54380** · Studio **54383** · SMTP (inbucket) **54384** · pooler **54389** (apagado) · analytics **54387** (apagado) |
| Levantar + migrar | `npm run db:local` (idempotente). Con base limpia: `npm run db:local:reset` |
| Parar el stack | `npm run db:local:parar` |
| Config de la app | `.env.docker.local`, **generado** por `db:local` (gitignoreado). Plantilla: `.env.docker.local.example` |
| Cuenta CON acceso | `con-acceso@ejemplo.com` / `cv-local-1234` (`tools/local/entorno.mjs`) |
| Cuenta SIN acceso | `sin-acceso@ejemplo.com` / `cv-local-1234` |
| Unitarios (portfolio + CV + tools) | `npm test` (⊥ necesita Docker) |
| Pruebas SQL | `npm run test:sql` |
| Integración (PostgREST + RLS real) | `npm run test:integracion` |
| E2E (Playwright, dos servidores) | `npm run test:e2e` |
| Typecheck | `npm run typecheck` |

Notas:

- **`--mode local` ⊥ existe**: Vite lo rechaza (choca con el postfijo `.local` de los `.env`). El modo
  es `docker` (la convención de `tools/scripts/db-local.mjs`).
- **`db.migrations` está apagado** en `supabase/config.toml`: `plataforma` (`has_app_access`) vive en el
  repo de guarnold-id (cuenta central) y tiene que existir **antes** de las migraciones de acá.
  `tools/local/preparar-stack.mjs` lee todas las `../guarnold-id/supabase/migrations/*_plataforma_*.sql`
  en orden de versión (⊥ copia: dos copias divergen). Otro lugar: `GUARNOLD_ID_REPO=/ruta`.
- **`supabase/roles.sql`** crea el esquema `cv-formatter` vacío al arrancar: PostgREST ⊥ arranca si
  un esquema de `api.schemas` ⊥ existe (503), y las migraciones corren después de la API.
- Las migraciones se registran en `supabase_migrations.schema_migrations` (la tabla del CLI), así que
  `db:local` aplica solo las nuevas.
- Las pruebas SQL vacían `profiles` dentro de su transacción (la RPC toma el primer perfil); el ROLLBACK
  devuelve el perfil del `db:local`.
- `dist/` y `test-results/` son artefactos: ⊥ se versionan.

### Importar el portfolio al editor

«Importar desde portfolio» (`src/cv/components/editor/ImportarPortfolio.tsx`) toma un `content.yml`
y lo **mezcla en el estado sin guardar**: el owner revisa el resumen y aprieta «Guardar». Hay dos fuentes:
«Usar el portfolio de este sitio» (el `src/data/content.yml` empaquetado, con `?raw`) y «Elegir content.yml».
La lógica es pura (`src/cv/lib/importarPortfolio.ts`, con tests en `src/cv/lib/__tests__/`). Fixture:
`tests/fixtures/content.yml`.

- Lo que trae el YAML pisa; lo que ⊥ existe se agrega con `enCv: false`. Los ítems se emparejan por
  nombre normalizado (sin paréntesis, sin tildes) o por `slug` en proyectos.
- **Foto**: `identity.avatar_url` es `/assets/profile.jpg`, un archivo de ESTE sitio (`public/assets/`): se ve en
  el CV sin aviso.
- `location.background_image` ⊥ tiene destino en la base: se omite con aviso.

### Portfolio: fuentes de datos

`src/services/dataService.ts`: la RPC `"cv-formatter".portfolio_publico()` con el cliente anónimo; si falla
o ⊥ hay configuración (`supabaseConfigurado`), usa `src/data/content.yml`. ⊥ se mezclan: o una o la otra.

## Learnings

- Una CSP con `img-src https:` a secas es un canal de exfiltración: los orígenes de imagen se listan a mano
  (hoy: `images.unsplash.com` y el Storage de Supabase). `verificar-headers.mjs` lo rechaza.
- Las cabeceras de `public/_headers` solo se sirven en `vite preview` (ver `tools/headers/preview-headers.ts`):
  el dev server necesita scripts inline del HMR.
- Un test de la RPC que hace `goto` por cada página cuenta una llamada por página (cada `goto` recarga el
  documento y el servicio cachea por documento). Navegar dentro de la app.
- El entorno de jsdom da `import.meta.url` con esquema `http:`: los tests que leen archivos con
  `fileURLToPath` van con `// @vitest-environment node`.
- Learning specific to THIS repo → document it HERE, versioned with the code.
  Useful in ANY project → belongs in the hub, ⊥ here.
