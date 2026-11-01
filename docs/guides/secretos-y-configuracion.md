# Secrets & configuration — where each thing goes

Measured setting up Guarnold ID + GuarNote + pivot in production (2026-10-07/08). Every row below
was either needed or a mistake that broke production. Read before configuring a new project.

## Where each kind of value lives

| Kind | Where | Examples |
|---|---|---|
| Secrets the **edge functions** read | Supabase → Edge Functions → Secrets | `GITHUB_APP_PRIVATE_KEY`, `OPENROUTER_API_KEY` |
| Auth SMTP password | Supabase → Authentication → SMTP Settings | Resend API key (#1) |
| Captcha secret | Supabase → Authentication → Attack Protection → Captcha | Turnstile **Secret key** |
| What the **deploy CI** needs | GitHub → repo → Settings → Environments → `produccion` | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROD_REF` |
| What a **site** needs | Netlify → site → Environment variables | `VITE_SUPABASE_URL`, `RESEND_API_KEY` (server functions) |
| Config editable at runtime | Inside the app (admin panel), stored in the DB | Allowed app origins, email sender |

**Who holds `SUPABASE_ACCESS_TOKEN` (CI de despliegue, environment `produccion`):** the repos that
deploy to Supabase = **guarnold-id** (plataforma + Auth config + plantillas de mail), **guarnote** and
**pivot**. Each one needs its own copy in its own environment; ⊥ a repo secret. The token opens every
project of its account, so ⊥ reuse it outside those repos.

## Backend propio vs Supabase Edge Functions

Where the backend logic runs decides where its secrets go:

1. **If it must set cookies on the app's own domain** (the session, the refresh token), it goes in
   functions of the front's host (Netlify Functions, Vercel, etc.). An HttpOnly cookie for
   `app.example.com` can only be set by a server that answers on that host. A Supabase Edge Function
   answers on `<ref>.supabase.co`, which is another host.
2. **Everything else can go in Supabase Edge Functions** (webhooks, jobs, logic that only touches the
   database or calls external APIs). Their secrets live in Supabase → Edge Functions → Secrets.
3. **Secrets go where the code that uses them runs.** A Resend key read by a Netlify function goes in
   Netlify; one read by an Edge Function goes in Supabase. Don't copy it "just in case".
4. Either way, the backend holds **no `service_role`**. The database decides authorization: a
   `SECURITY DEFINER` function that checks the caller with its own token (see rule 3 below).

Real case: `personal/guarnold-id/docs/arquitectura-y-secretos.md` (central login: session cookie in
Netlify; own mails through Resend from Netlify; Supabase's SMTP only for Auth mails).

## Rules (each one learned the hard way)

1. **`VITE_*` is public.** Vite bakes it into the JS the browser downloads. Only non-`VITE_` Netlify
   variables are secret, and only Netlify **functions** can read them.
2. **Edge secret names ⊥ can start with `SUPABASE_`.** The dashboard and the API reject them
   (measured: `SUPABASE_JWT_SECRET` was impossible to set and blocked the CI forever).
3. **⊥ `service_role` in any server you run** (Netlify functions, your API). Admin = `SECURITY
   DEFINER` SQL functions called with the admin's own token, checking admin + `aal2` inside.
   🔗 `auth-y-sesiones.md §9`.
4. **⊥ mint JWTs yourself.** Projects on the new asymmetric JWT signing keys can't (Supabase holds
   the private key), and a function holding the legacy JWT secret can forge any user = `service_role`.
   To act as a user from a function: connect with the injected `SUPABASE_DB_URL` and, inside a
   transaction, `SET LOCAL ROLE authenticated` + `set_config('request.jwt.claims', …, true)`.
5. **⊥ shared passwords between the DB and a function** (trigger + pg_net + secret in Vault +
   secret in the function). Two places to keep in sync and a `service_role` path. Call the function
   from the app **with the user's session** and do the long work with `EdgeRuntime.waitUntil`.
   (Measured in GuarNote: the trigger path was a duplicate of the direct call — deleted.)
6. **Constants that ⊥ change go in code, ⊥ in env vars.** E.g. the central account URL: GuarNote and
   pivot turn on Guarnold ID when served from `*.guarnold.com.ar`; local/CI/preview keep their own
   login. An env var stays only as a local-testing override.
7. **One secret per consumer when it can leak independently.** Resend: one API key for Supabase
   SMTP, another for the site's server — revoking one doesn't stop the other.

## Captcha (Cloudflare Turnstile) — order matters

Turning captcha on in Supabase makes **every** sign-in, sign-up and password recovery of the whole
project require a captcha token. Apps that log in directly with supabase-js and ⊥ send it break at
once (measured 2026-10-07: guarnote, pivot and the account site all returned
`captcha_failed: no captcha_token found`).

1. Cloudflare → Turnstile → **Add site** → get **Site key** (public) and **Secret key**.
2. Site key → the login site's build (`VITE_TURNSTILE_SITE_KEY`) and **deploy it**.
3. Make sure **every** app logs in through that site (or sends the token itself).
4. Only then: Supabase → Authentication → Attack Protection → Captcha → provider **Turnstile by
   Cloudflare** → paste **only the Secret key** → Save.

## Email (Resend): dos canales, dos claves

Resend atiende dos canales distintos. Cada uno tiene su clave, y ninguno usa la del otro.

| Canal | Qué manda | Dónde se carga la clave | Clave |
|---|---|---|---|
| **SMTP de Supabase** (Auth) | Confirmación, recuperación, cambio de email, magic link, reautenticación y avisos de seguridad | Supabase → Authentication → SMTP Settings | **#1** |
| **Servidor propio** (Netlify Functions o Edge Function, según dónde corra el código) | Lo que no es de Auth: invitaciones, avisos de dispositivo nuevo, notificaciones de la app | `RESEND_API_KEY`, secret en Netlify o en Supabase → Edge Functions → Secrets | **#2** |

Pasos, en orden:

1. Resend → **Domains** → agregar el dominio → cargar los registros DNS que muestra → esperar *Verified*.
   Sin dominio verificado no sale ningún mail, ni por SMTP ni por API. Guía paso a paso:
   `docs/guides/dns-email-dominio.md`.
2. **Clave #1** (*Sending access*, restringida al dominio) → Supabase → Authentication → SMTP Settings:
   host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = la clave #1 (Resend usa la
   propia API key como contraseña SMTP), remitente `Nombre <no-reply@tudominio>` con un dominio verificado.
   Sin SMTP propio, Supabase manda unos 2 mails por hora y **solo a miembros del equipo**. Alcanza para
   el owner, no para usuarios externos.
3. **Clave #2** (mismos permisos, otra clave en Resend) → el servidor propio: `RESEND_API_KEY`, marcada
   como secreto. Los mails de ese canal **no** pasan por Supabase.

### Por qué una clave por consumidor

- **Revocación aislada.** Si se filtra la clave #2 (la del servidor), se revoca y el SMTP de Auth
  sigue andando, y al revés. Con una sola clave, rotar una obliga a tocar los dos lados a la vez.
- **Ubicación del secreto.** La clave #1 vive en el panel de Supabase, la #2 donde corre el código que
  la usa. Regla 7: separar lo que puede filtrarse por separado.
- **Sin mezclar superficies.** Si la clave del servidor se usara en el SMTP, un fallo del servidor
  cortaría también los mails de seguridad de Auth.

### Plantillas de Auth versionadas

Las plantillas de los mails de Auth **no se editan en el panel**: viven en el repo y el CI las aplica.

- `supabase/templates/*.html` (una por evento: `confirmation`, `recovery`, `magic_link`, `invite`, etc.)
  y `supabase/templates/asuntos.json` con los asuntos. Si se generan desde un script del repo, se edita
  el script y no el HTML.
- `supabase/despliegue.json` → bloque `auth` → `"$plantillas": "supabase/templates"`. El script de
  despliegue expande esa carpeta en `mailer_templates_*_content` y `mailer_subjects_*`, y el CI la aplica
  al entrar a `main`. Cualquier cambio hecho en el panel se pisa en el próximo despliegue.
- Las claves de notificación de seguridad (`mailer_notifications_*`) también van en ese bloque. Son
  las que avisan por mail al cambiar contraseña, email o 2FA.

### Site URL y redirects

- **Site URL** (`auth.site_url` en `despliegue.json`): la base que usan los links de los mails. Las
  plantillas arman el link con `{{ .SiteURL }}`, así que una Site URL equivocada manda los links a otro
  host.
- **Redirect URLs** (`auth.uri_allow_list`): la lista es **entera**. El despliegue la reemplaza, así que
  cualquier redirect que una app necesite se agrega en ese archivo, no en el panel.
- `mailer_autoconfirm: false` cuando las invitaciones dependen de confirmar el email: con la
  confirmación apagada, cualquiera que se registre con el email invitado se queda con el acceso.

## Deploy CI token

Scoped personal access token, exact permissions: 🔗 `despliegue-supabase.md §Token`. Only repos that
deploy to Supabase get it (a site without migrations/functions ⊥ needs it).

## Pending pattern: build hook

`NETLIFY_BUILD_HOOK` in the `produccion` environment lets the deploy CI publish the front **after**
the DB is migrated (today: merge with `[skip netlify]` and publish by hand). 🔗
`despliegue-supabase.md §Front`.
