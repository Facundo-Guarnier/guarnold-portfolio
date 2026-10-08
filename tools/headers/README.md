# tools/headers — the second line that makes `localStorage` sessions survivable

| File | Copy to | What it is |
|---|---|---|
| `_headers` | `public/_headers` | The headers themselves. **! fill in the `connect-src`** |
| `headers.mjs` | `tools/headers/` | Parses `_headers`. One source, two readers |
| `verificar-headers.mjs` | `tools/headers/` | Static check. `npm run verificar:headers` |
| `preview-headers.ts` | `tools/headers/` | Vite plugin: `vite preview` serves the **same** headers |

Add `"verificar:headers": "node tools/headers/verificar-headers.mjs"`, wire it into the pre-commit
gate, and register `servirHeadersEnPreview()` in `vite.config.ts`.

## Why `public/_headers` and ⊥ a `[[headers]]` block in `netlify.toml`

Because the piece has to be **additive**. Measured: 3 of the repos already ship a `netlify.toml`
with their redirects and cache rules — *"copy this `netlify.toml`"* would silently overwrite live
config. `_headers` is a separate file that coexists, so installing it can ⊥ break anything that was
already there. (Measured too: **⊥ one repo** uses `public/_headers` today, so there is no collision
anywhere.)

Second reason, smaller but real: the format is a path plus indented headers ∴ parsing it is 15
lines and needs **⊥ a TOML dependency**.

## This closes an argument the template left half-made

`auth-y-sesiones.md §4` argues the session lives in `localStorage` and that *"the real defense is ⊥
having XSS"*. Correct — and the template ⊥ ship the second line that makes it survivable.

A `connect-src` scoped to your Supabase project means an XSS that happens anyway (a compromised
dependency) **can ⊥ exfiltrate the token**: the browser blocks the fetch. It turns a session theft
into a defacement. That is the mitigation §4 was missing.

| Header | What it closes **here** |
|---|---|
| `Content-Security-Policy` | ↑ the `connect-src` above all else |
| `Referrer-Policy` | `auth-y-sesiones.md §5b` documents that URLs carry payload (`/invite/xyz?token=…`). Without this, that token rides in the `Referer` to any external domain the page loads |
| `X-Frame-Options` + `frame-ancestors` | Clickjacking. With ERPs and panels behind a login, an iframe over a "confirm" button ⊥ theoretical |
| `X-Content-Type-Options` | Cheap, no downside |
| `Strict-Transport-Security` | ⚠️ **⊥ `preload`**: hard to reverse, marginal gain on small apps |

⚠️ `style-src` keeps `'unsafe-inline'`: Tailwind and shadcn inject `<style>`. It's a known,
acceptable trade — it ⊥ allow executing JS. `script-src` does **⊥** need it: measured, Vite emits
the bundle as an external `<script type="module" src="/assets/index-HASH.js">` ∴ **⊥ nonces, ⊥ CSP
hashes, ⊥ build plugin**. That's what makes this cheap instead of expensive.

## 🔴 A placeholder is worse than a missing header

`connect-src` names **your** Supabase project ∴ the file is ⊥ copyable as-is. A
`[COMPLETAR-PROYECTO]` left in place blocks everything useful **and looks configured** — it's
literally the `+1-555-0123` trap that `verificar-seo.mjs` already catches in structured data.

∴ the checker fails on the placeholder, ⊥ only on the missing header. Measured on install: the
first run in the pilot went red on exactly that, before anything else.

## Verification in three levels, and the distinction is the point

**1. Static (`verificar-headers.mjs`, pre-commit, no network).** Reads the file: required headers
present, ⊥ placeholders, `connect-src` declared and ⊥ `*`, `script-src` without `'unsafe-inline'`
/ `'unsafe-eval'`, `frame-ancestors` present.

💡 Free from the same read: it also checks `public/_redirects` exists. A SPA without a catch-all
serves **Netlify's 404 on every deep link** — sharing a link to a note lands on an error page.
⊥ security, and it costs nothing since we're already reading `public/`.

⊥ the *deploy*, and a CSP that is wrong ⊥ fail in local — it fails **in production**, which is the
worst failure mode a config file can have. So `preview-headers.ts` makes `vite preview` serve the
same file, and the test walks the app failing on any CSP violation in the console.

> ⚠️ **The test almost verified nothing.** First version used `apply: 'preview'` — ⊥ a valid value
> (`apply` takes `serve`/`build`) and Vite drops the plugin **in silence**. The suite would have
> passed with **zero CSP served**: nothing to violate, no violations. What caught it was the
> assertion *"did the header actually arrive?"* before any other. A CSP test without that line
> tests the absence of a CSP.

⚠️ It can ⊥ live in the E2E suite: that one runs against `npm run dev`, where a strict `script-src`
breaks HMR (Vite injects inline scripts) ∴ the plugin is preview-only. **Consequence, said out
loud**: this covers the public shell — HTML, chunks, styles, fonts, the auth connection — and ⊥ the
authenticated app, where the calls to external APIs live. Those rest on the hand-written
`connect-src` and on level 3.

**3. After deploying, once.** Netlify can ignore a malformed file and level 1 would still be green:

```bash
curl -sI https://your-site | grep -i "content-security\|strict-transport\|x-frame"
```

Needs network ∴ it ⊥ belong in the pre-commit. It's a step in the deploy checklist, ⊥ a check.

## Mutants run

| Mutant | What it says |
|---|---|
| `_headers` missing | red, with the copy command |
| placeholder left in | red, naming the header |
| `apply: 'preview'` (plugin ⊥ loads) | red: `Received: undefined` on the header |
| `fonts.googleapis.com` out of `style-src` | red, quoting the browser's `Refused to load` |
| `connect-src *` | red: it restricts nothing |

## What to do when it goes red in a project

⊥ loosen the whole CSP. The console line names **which resource** and **which directive** blocked
it: add that origin to that directive. A `connect-src` that grew to `*` is the same as ⊥ having the
header, with the extra cost of looking like it's there.
