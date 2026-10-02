# Supabase MCP Wrapper — setup & usage

Single source for setting up & using the Supabase MCP in this project.
Wrapper pins the Supabase project from `.env` & blocks schema changes (DDL) via `execute_sql`.

## Files
- Wrapper: `tools/mcp/supabase/supabase-mcp-wrapper.cjs` — the ONLY file w/ logic.

> There is no separate `supabase-mcp-sql-guard.cjs` any more. It existed, nothing ever
> `require`d it, and its regexes were unanchored (`/create/`) ∴ it rejected
> `SELECT ... WHERE motivo = 'create'`. The live check lives inside the wrapper, anchored
> at `^` & stripping comments first. Deleted 2026-08-28 — dead code that looked like a guardrail.

## Why
- Pin Supabase project from `.env` → agents/IDEs ⊥ hit another project by accident.
- Block DDL via `execute_sql`: guard returns an error → schema changes ! go through `apply_migration` + a draft in `supabase/migrations-draft/<desc>.sql`. 🔗 `MIGRATIONS.md`.

## Setup
1. `.env` (see `.env.example`):
   ```env
   SUPABASE_REMOTE_REF=<project-ref>     # subdomain of VITE_SUPABASE_URL (SUPABASE_PROJECT_ID = legacy name, still read LAST)
   SUPABASE_ACCESS_TOKEN=sbp_<token>     # https://supabase.com/dashboard/account/tokens — ⊥ commit real value
   ```
   `MCP_PROJECT_DIR` optional (defaults to repo root).
2. Registered in `.mcp.json` as server `supabase-wrapper` (already configured):
   ```json
   {
     "mcpServers": {
       "supabase-wrapper": {
         "command": "node",
         "args": ["tools/mcp/supabase/supabase-mcp-wrapper.cjs"]
       }
     }
   }
   ```
3. First run: approve w/ `/mcp` in Claude Code.

⚠️ **One Supabase project can host SEVERAL apps** (one schema each). Then the MCP of one repo can
write into another app's schema: the SQL guard does ⊥ scope by schema. Say it in that repo's
`AGENTS.md` §1 as a hard rule (qualify every table), and name migration drafts with the app prefix
— the migration history is ONE per project, shared by every app in it.

## Usage (MCP tools)
- `mcp__supabase-wrapper__list_migrations` — list applied migrations (read).
- `mcp__supabase-wrapper__execute_sql(query)` — read/data ONLY. Guard blocks DDL (`CREATE/ALTER/DROP/TRUNCATE/GRANT/...`).
- `mcp__supabase-wrapper__apply_migration(name)` — DDL. `name` = the **description only**: snake_case, ⊥ `.sql`, ⊥ timestamp (the wrapper rejects one).
  The draft `supabase/migrations-draft/<desc>.sql` ! exist FIRST — the wrapper reads it and injects its content, overwriting whatever `query` you pass ∴ **what runs ≡ what's versioned**.
  It also rejects non-idempotent SQL: `CREATE TABLE`/`ADD COLUMN`/`CREATE INDEX` w/o `IF NOT EXISTS`, `CREATE FUNCTION` w/o `OR REPLACE`, and (2.2.0+) `CREATE POLICY`/`TRIGGER` w/o a same-name `DROP ... IF EXISTS` and `CREATE TYPE` outside a `DO` block. On success it renames the draft to `supabase/migrations/<version>_<desc>.sql` — the **server** assigns `<version>` — and answers with the definitive name. Failure → the draft stays intact; fix it, retry w/ the SAME `<desc>`.

Full DDL flow → skill `db-new-migrations` + `MIGRATIONS.md`.

## The 23 tools — what exists, what's exposed, what's allowed

**23 tools exist. The server exposes 20** — the `storage` group is OFF by default.
Asking the server `tools/list` answers *"what do I have"*, ⊥ *"what exists"*: for the second
question you have to look at the package. Feature groups the server accepts:
`docs, account, database, debugging, development, functions, branching, storage` — the default set
is all of them **minus `storage`**.

| Tool | dev | prod-ro | Kind |
|---|---|---|---|
| `execute_sql` | ✅ | ✅ read-only (`25006`) | read/data |
| `list_tables` | ✅ | ✅ | read — **the** tool for "what columns does `t` have" |
| `list_migrations` · `list_extensions` · `get_advisors` | ✅ | ✅ | read |
| `list_edge_functions` · `get_edge_function` | ✅ | ✅ | read |
| `search_docs` · `get_project_url` · `get_publishable_keys` · `list_branches` | ✅ | ✅ | read |
| `generate_typescript_types` | ✅ | ✅ | read — **regenerates `types.ts` from the live schema** |
| `query_logs` | ✅ | ✅ | read — postgres/api/auth/edge logs |
| `apply_migration` | ✅ allowed (it IS the flow) | ⛔ pruned | write |
| `deploy_edge_function` | ⚠️ asks | ⛔ pruned | write |
| `create_branch` · `delete_branch` · `merge_branch` · `reset_branch` · `rebase_branch` | ⚠️ asks | ⛔ pruned | write |
| `list_storage_buckets` · `get_storage_config` | ⊥ exposed | ⊥ exposed | read (`storage` group) |
| `update_storage_config` | ⊥ exposed | ⊥ exposed | write (`storage` group) |

**Every read tool that IS exposed is in the allowlist. That's the point, ⊥ a detail.** A tool
missing from the allowlist raises no error — it just asks for permission every time, which reads as
normal friction, ⊥ as broken config. Measured: `list_tables` was allowed on prod and NOT on dev for
months, so answering "what columns does `t` have" cost a prompt while reading
`supabase/migrations/*.sql` cost nothing — and the agent took the free path, to the WRONG source.
**Make the correct path the one with LESS friction, or the wrong one wins.**

Writes stay behind a prompt on purpose (`deploy_edge_function` above all). `apply_migration` is the
exception: it's the migration flow itself.

### Keeping it honest
`node tools/scripts/auditar-mcp.mjs` asks BOTH servers what they expose, diffs it against the
allowlist, and exits 1 if a read tool is exposed but not allowed. It also flags *dead* permissions
(allowed but ⊥ exposed) and reminds you which feature groups are off. Run it after touching
`.claude/settings.json` or bumping `MCP_SERVER_VERSION`.

### Turning `storage` on
Only if the repo actually uses Supabase Storage. Add to the wrapper's server args:
`--features=docs,account,database,debugging,development,functions,branching,storage`.
`update_storage_config` is a WRITE: it's already in `WRITE_TOOLS` (pruned on prod) — leave it out of
the allowlist on dev too.

## Installing this into an existing repo

Checklist. Skipping a step ⊥ produce a clear error — see what each one breaks.

1. **Wrapper → `tools/mcp/supabase/`.** The root is deduced by counting 3 folders up from the
   file. Old copies lived in `.vscode/` w/ `".."` ∴ dropping this one there resolves OUTSIDE the
   repo. **⊥ "fix" that w/ `MCP_PROJECT_DIR: "${workspaceFolder}"` in `.mcp.json`** — Claude Code
   ⊥ expand that (it is VS Code syntax), the wrapper gets the literal string and dies. Move the
   file, or set an ABSOLUTE path. The wrapper now refuses to start on an unexpanded `${…}`.
2. **`supabase/migrations-draft/`** ! exist, or every `apply_migration` fails.
3. **Skill `db-new-migrations`.** Without it the flow works but the agent ⊥ know it exists.
4. **Env**: `SUPABASE_REMOTE_REF` (+ `SUPABASE_PROD_REF` only for the prod server).
5. **Allowlist in `.claude/settings.json`.** Every READ tool the server exposes ! be allowed —
   a missing one just prompts, which reads as normal friction, ⊥ as broken config, and the agent
   takes the cheaper wrong path instead (that is how `list_tables` sat unallowed for months).
   Run `node tools/scripts/auditar-mcp.mjs` — it exits 1 when a read tool is exposed & unallowed.
   Renaming a server renames its tools ∴ follow the rename in `permissions.allow` and
   `enabledMcpjsonServers`, or they point at a server that ⊥ exists.
6. **Both hooks** in `.claude/settings.json`: `Write|Edit` → `migration-review.cjs`,
   `Read|Grep|Glob` → `lectura-migraciones.cjs`.
7. **`AGENTS.md` §1 + §1b + §1c** — which server is which, prod ⊥ writable, and that current
   state comes from the DB and ⊥ from reading migrations.
8. **Existing migrations w/ hand-written timestamps: leave them.** The flow applies going forward.

Then apply a throwaway migration and confirm the file **renames itself** — the part that breaks
silently when the MCP server version moves.

