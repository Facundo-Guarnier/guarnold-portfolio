# Supabase deploy — migrations + edge functions from `main`, free

How a merge to `main` reaches the **cloud** Supabase project: pending migrations applied, changed
edge functions deployed, and **before anything**, the secrets the code needs checked. GitHub
Actions + the Management API. No paid plan.

Pieces: `tools/deploy/desplegar-supabase.mjs` (runs), `tools/deploy/plan-supabase.mjs` (decides,
pure, tested), `.github/workflows/desplegar-supabase.yml`, `supabase/despliegue.json` (per repo).

## Why ⊥ the obvious tools

| Option                                  | Why ⊥                                                                                                                                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase GitHub integration (branching) | Paid plan.                                                                                                                                                                                                                                          |
| `supabase db push`                      | Aborts when the remote has versions ⊥ in local — **always** true in a project shared by several repos (one schema per app, ONE history). Its suggested fix, `migration repair --status reverted`, erases the other apps from the history.           |
| «local files − remote versions»         | Measured 2026-10-04 on real repos, it would have **re-run old migrations in production**: files recorded under a different version (MCP/panel assign their own timestamp), and files that were another project's history. See §What stops a deploy. |
| `supabase functions deploy --prune`     | Deletes every function ⊥ in THIS repo → the other apps' functions. **Never.**                                                                                                                                                                       |

## The flow

```
PR → main        plan (read-only): what would be applied + everything that blocks it. Red = ⊥ merge.
push to main     1. read schema_migrations          (Management API, read_only)
                 2. plan migrations; check secrets  ← any problem → stop, NOTHING applied
                 3. apply each pending migration    (lock + file + record = ONE transaction)
                 4. deploy changed functions        (CLI --use-api, no Docker)
                 5. move tag supabase/desplegado    (next run diffs from here)
                 6. optional: Netlify build hook    (front AFTER the DB)
```

- **One migration = one query** to `POST /v1/projects/{ref}/database/query`: advisory lock + the
  file + the `INSERT` into `supabase_migrations.schema_migrations`. A multi-statement simple query
  is one implicit transaction → the file fails = ⊥ recorded; the record fails = the file rolls
  back. Verified on a disposable Postgres: failing migration leaves neither its table nor its row.
- **The lock** (`pg_advisory_xact_lock`) serializes deploys from DIFFERENT repos to the same
  project. GitHub's `concurrency` is per repo and can't see the others.
- **Post-check against the DB**, ⊥ against the response: after each migration, its version must
  be in `schema_migrations`. A 2xx proves nothing.
- **Functions**: only those whose folder changed since the tag. Anything under
  `supabase/functions/_*`, `config.toml` (holds `verify_jwt`) or the functions import map → all.
  No tag yet → all. A function deleted in the repo is **reported, ⊥ deleted** (no `--prune`).
- **The tag moves only on success.** A failed run leaves it → the next run retries the same + new.

## What stops a deploy

All collected and printed together (a PR shows every problem at once), then exit 1.

| Stop                                                                         | Real case that motivated it                                                                               | Fix                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Pending with the **same name** as an applied migration under another version | GuarNote: 26 files whose MCP/panel record has another timestamp. Re-applying = running them twice in prod | Rename the file to the real version, or set `migraciones.base` (below) |
| Pending **older** than this repo's latest applied                            | pivot: 6 files of 2024-25 that were ANOTHER project's history                                             | Archive them, or give a new version if it really must run              |
| File ⊥ `<14 digits>_<name>.sql`                                              | cv-formatter: `20260114_create_cv_formatter_schema.sql`, recorded as `20260115000436`                     | Rename to the real version                                             |
| `BEGIN`/`COMMIT` in the file (outside `$$` bodies)                           | —                                                                                                         | Remove: each file is already atomic                                    |
| Code reads a secret the manifest ⊥ declares                                  | —                                                                                                         | Add it to `requeridos` / `opcionales`                                  |
| A required secret ⊥ set in the project                                       | GuarNote on 2026-10-04: 5 missing, 2 of them ⊥ in any checklist                                           | Set it (Edge Functions → Secrets), re-run                              |

"This repo's latest applied" = the highest LOCAL version present remotely. Other repos' versions ⊥
count: pivot applying something today ⊥ make guarnote's yesterday migration "old".

## `supabase/despliegue.json`

```json
{
  "migraciones": {
    "base": "20260517221832",
    "porque": "why this cut — measured facts, date"
  },
  "secretos": {
    "requeridos": ["WEBHOOK_SECRET", "..."],
    "opcionales": ["OPENROUTER_API_KEY"],
    "notas": { "WEBHOOK_SECRET": "which function, what breaks without it" }
  }
}
```

**`migraciones.base`** — only for a repo w/ history from before the current flow (panel, Lovable,
another project). Up to that version inclusive, files are history: **production is the truth**,
they're ⊥ compared nor applied (reported as a count). ⊥ a way to silence a stop: set it to the last
file of the messy era, after measuring that everything AFTER it matches by version. New repos: omit.

**`auth`** — optional: Auth settings of the project (`GET/PATCH /v1/projects/{ref}/config/auth`
names), e.g. `"jwt_exp": 600`. Only the declared keys are touched; the plan prints `actual → deseado`;
after the PATCH the values are re-read (a 2xx proves nothing). Stops on a key the project ⊥ has (typo)
and on anything secret-looking (`*secret*`, `*_key`, `smtp_pass`…: those go in the panel, never in
the repo). ⚠️ It's PROJECT-wide: in a shared project only ONE repo declares it, or two repos fight.

**`secretos`** — required if the repo has edge functions. Literal `Deno.env.get('X')` reads are
scanned and must be declared; that's a LOWER bound (`Deno.env.get(name)` w/ a variable ⊥ visible)
∴ the manifest is the source of truth. `SUPABASE_URL`, `*_ANON_KEY`, `*_SERVICE_ROLE_KEY`,
`SUPABASE_DB_URL`, `SUPABASE_JWKS`, `SUPABASE_*_KEYS` are injected by Supabase: ⊥ declare.

## Setup (owner, once per repo)

1. GitHub → Settings → Environments → **`produccion`**. Secrets:
   - `SUPABASE_ACCESS_TOKEN` — a **scoped** personal access token (supabase.com/dashboard/account/tokens,
     starts with `sbp_fc`). Lives ONLY in this environment, ⊥ as a repo secret. Permissions: §Token below.
   - `SUPABASE_PROD_REF` — the project ref.
   - `NETLIFY_BUILD_HOOK` — optional, see §Front.
2. Write `supabase/despliegue.json`. Run the plan locally against prod (read-only):
   `node tools/scripts/run-with-secrets.mjs node tools/deploy/desplegar-supabase.mjs --plan`
3. Merge. First run has no tag → deploys all functions. Expected.

## Token (scoped PAT) — exact permissions

Decided 2026-10-07: **one** token per Supabase project, pasted in the `produccion` environment of
every repo that deploys to it. Broad enough that a new edge function or bucket ⊥ needs a new token;
⊥ keys, ⊥ infra, ⊥ organization. Access ⊥ editable after creation → create a new one, revoke the old.

**Resource:** only the project (e.g. *Guarnold Main*). No organization or account permission.

| Capability (panel name) | Level |
|---|---|
| Project Settings | Read-write |
| Auth Config | Read-write |
| Development Branches | Read-write |
| Data API Config | Read-write |
| Database | Read-write |
| Migrations | Read-write |
| Database Webhooks | Read-write |
| Edge Functions | Read-write |
| Realtime Config | Read-write |
| Storage | Read-write |
| Storage Config | Read-write |
| Edge Function Secrets | Read |

**None, on purpose:** API Keys, API Key Secrets, Data API JWT Secret, Auth Signing Keys, Backups,
Production Branches, Custom Domains, Network Restrictions/Bans, Disk Config, Compute, Read Replicas,
Read-only Mode, SSL Enforcement, Database Config/JIT, Connection Pooling, and every organization/account
one. Why: with Database read-write a leaked token already owns the data; what's excluded is what
revoking the token ⊥ undoes (keys that keep working, restoring an old backup, network, project transfer).

Buckets ⊥ need Storage: they're created with SQL in a migration (Database). Edge secret names ⊥ can
start with `SUPABASE_`: the dashboard and the API reject them.

## Per project type

|                         | Shared project (Guarnold Main) | Own project (personal)                                             | **Client**                                                                                                     |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Supabase account        | owner's                        | owner's                                                            | **the client's** (or theirs transferred later)                                                                 |
| `SUPABASE_ACCESS_TOKEN` | owner's                        | owner's                                                            | a token **of the account that owns the project** — ⊥ reuse the owner's: it opens every project of that account |
| `migraciones.base`      | per repo, if messy history     | usually none                                                       | none if born from the template; else measure first (`--plan`)                                                  |
| `db push` would work?   | ⊥ (other apps' history)        | yes, but the script is used anyway: same stops, same secrets check | same                                                                                                           |
| Who merges to `main`    | owner                          | owner                                                              | owner / agreed w/ the client — **merge = prod deploy**, write it in the contract/handover                      |

Install in an existing repo: copy `tools/deploy/`, the workflow and its test → write
`supabase/despliegue.json` → run `--plan` against prod **read-only** → fix every stop it prints →
environment `produccion` → merge. ⊥ skip the `--plan`: it's where 26 re-runs were caught.

## Front (Netlify) — after the DB, ⊥ before

Netlify builds `main` on its own, in parallel ∴ the front can go live **before** the migration it
needs. Two ways:

- **Expand/contract** (always good practice): migrations that the OLD front tolerates. Enough when
  the change is additive.
- **Hook**: Netlify → Build hooks → create one → `NETLIFY_BUILD_HOOK` secret. Then make Netlify skip
  its own git builds, keeping hook builds: Site settings → Build → **Ignore builds** =
  `[ -z "$INCOMING_HOOK_TITLE" ]` (exit 0 = skip). ⚠️ Order: hook secret FIRST, ignore rule second —
  the other way round there are no deploys at all. Bonus: exactly one paid build per release.
  ⚠️ ⊥ measured yet (from Netlify's docs: hook builds get `INCOMING_HOOK_*` env vars; ignore exit
  0 = cancel). Confirm on the first release: one push → zero git builds, one hook build.

## Local test (disposable DB)

`SUPABASE_DEPLOY_DB=docker:<container>` swaps the API for `psql` inside a container (same
one-message semantics). Secrets & functions are skipped **loudly** (no local API for them). Use a
throwaway Postgres, ⊥ the project's ephemeral stack:

```bash
docker run -d --name deploy-prueba -e POSTGRES_PASSWORD=postgres public.ecr.aws/supabase/postgres:17.6.1.167
# create supabase_migrations.schema_migrations, then:
SUPABASE_DEPLOY_DB=docker:deploy-prueba node tools/deploy/desplegar-supabase.mjs --aplicar
```

## Who does what

|                                                           | Owner           | Agent        |
| --------------------------------------------------------- | --------------- | ------------ |
| Merge to `main` (= deploy)                                | ✅              | ❌           |
| Set secrets, environment, hook                            | ✅              | ❌           |
| Write migrations (drafts → `migrations/`), test in Docker | —               | ✅           |
| Run `--plan` against prod                                 | ✅              | ✅ read-only |
| Run `--aplicar` by hand                                   | in an emergency | ❌           |

The agent's MCP `deploy_edge_function` / `apply_migration` against the shared project stays
available for **dev-only** projects; for an app already in use, Docker is dev and `main` is the
only way to prod.
