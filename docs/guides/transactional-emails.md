# Enviar emails desde una app Supabase (Edge Function + Resend)

> **Self-contained & generic** guide, project-independent. How to make an app with Supabase
> backend send transactional emails (notifications, status alerts, etc.) fired from the DB.
> Documents real complications & how to solve them. Written for **Resend** via its REST
> API; any provider with an HTTP API (SendGrid, Postmark, SES…) is the same shape — only the `fetch` changes.
>
> 🔑 **Convention in every project: the ONLY secret is `RESEND_API_KEY`.** Everything else
> (endpoint, sender) = constants in the code. See §5.

---

## 0. El malentendido que arruina el primer intento

**Authentication → Emails → SMTP Settings SMTP in the dashboard ⊥ works for your app's emails.**
That channel → **only Supabase Auth**: account confirmation, password reset, magic links, Auth security notices.
Invitations and business notices are **not** Auth mails: they go through your own server with a second Resend key
(§5.1). Full split of the two channels and their keys: `secretos-y-configuracion.md` § Email.

| Mail | Canal | Clave |
|---|---|---|
| Confirmación, recuperación, magic link, avisos de seguridad de Auth | SMTP de Supabase (panel, plantillas versionadas) | #1 |
| Invitación, aviso de dispositivo nuevo, notificación de la app | Servidor propio → API de Resend (esta guía, §4) | #2 = `RESEND_API_KEY` |

If the code that sends runs in **Netlify Functions** instead of an Edge Function, the same rules hold:
`RESEND_API_KEY` goes in Netlify (secret), not in Supabase. The "secret goes where the code runs" rule.

Edge Functions ⊥ can read that config — Supabase ⊥ exposes it to the runtime.
Sending mail "from the app" (business notification) →:

1. Your own provider credential (Resend **API key**).
2. Load it as an **Edge Function secret** `RESEND_API_KEY` (even if it is the same one you put in
   Auth → SMTP; repeat it, they are two distinct channels).
3. Edge Function calls the provider's API & sends.

Understanding this up front saves hours. The rest = plumbing around this fact.

---

## 1. Arquitectura

```
Un evento en tu app (cambio de estado, alta, etc.)
        ↓  (INSERT en una tabla "cola de notificaciones")
Trigger en la DB  →  función que hace un POST HTTP (extensión pg_net)
        ↓  Authorization: Bearer <service_role_key>   (leída de Vault)
Edge Function (Deno)
        ↓  llama a la API del proveedor con la key de su secret
Proveedor (Resend)  →  bandeja del destinatario
```

Pieces:

- **Queue table**: one row per email to send, flags `requiere_email` / `email_enviado`.
  Persisting the queue → **fault-tolerant** system: provider down → row stays pending & retries;
  ⊥ mail lost.
- **Trigger + pg_net**: fires the send as soon as the event happens (low latency).
- **Cron (pg_cron)**: sweeps the queue every N min & retries pending ones (safety net if trigger | provider fail at the moment).
- **Edge Function**: the only component that talks to the provider. Claims the queue atomically, sends, returns failed ones to the queue.
- **Vault**: stores encrypted the `service_role_key` the trigger needs to authenticate the POST
  (⊥ hardcoded in a migration → would end up in git).

### ¿Por qué trigger + cola y no mandar directo?

- The Edge Function ⊥ can be called directly by an `INSERT`; someone ! do the HTTP. In Postgres → `pg_net`.
- Sending "inline" inside the transaction → slow | provider down **blocks | breaks** the business
  operation (approving something, closing an order…). The queue decouples: the event just writes the row & finishes;
  the send happens later, separately.

---

## 2. Requisitos previos

- Supabase project with access to the **SQL Editor** & the **dashboard** (Settings, Edge Functions).
- Extensions `pg_net` & `pg_cron` (installed with `create extension if not exists ...`;
  on Supabase they are usually available).
- Extension `supabase_vault` (comes installed on Supabase).
- A **Resend** account (free plan: 3000 mails/month) with a verified domain.

---

## 3. Configurar Resend

1. Create an account & **verify your sending domain** (see §7 — the step that causes most trouble; ⊥ skip).
   Step by step (DNS on Netlify, domain at NIC.ar): `dns-email-dominio.md`.
2. Generate an **API key** (`re_...`): Resend → API Keys → **Sending access**, restricted to **that
   domain**. **One key per project, always named `RESEND_API_KEY`** — if one leaks you revoke it
   without touching the others. Write it down: Resend **⊥ shows it again**.
3. That key is the only thing you load anywhere (§5). Resend also offers SMTP
   (`smtp.resend.com:465`, user `resend`, password = an API key) — that is for Auth → SMTP in the
   dashboard, with **its own key #1**, ⊥ the one of this function. Two keys, two consumers: see
   `secretos-y-configuracion.md` § Email for why.

---

## 4. La Edge Function

Minimal Deno example calling Resend's REST API (⊥ extra dependency). Reads the key from its secret,
claims the queue via RPC, sends one mail per row, returns failed ones to the queue.

```ts
import { createClient } from "jsr:@supabase/supabase-js@2";

// Config que ⊥ es secreta ni cambia entre entornos → versionada en el código, ⊥ en secrets.
// Su cambio es un commit revisable; en secrets sería un valor invisible que puede desviarse
// entre dev y prod sin que nadie lo note.
const RESEND_URL = "https://api.resend.com/emails";
const FROM = "Mi App <no-reply@midominio.com>"; // dominio ! verificado → dns-email-dominio.md

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });

  // Candado: solo quien tenga la service_role key puede disparar envíos.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
    return new Response("unauthorized", { status: 401 });
  }

  // ÚNICO secret. ⊥ default literal: un secreto con fallback es una contraseña pública.
  const apiKey = Deno.env.get("RESEND_API_KEY");
  // Sin key, no tocar la cola: dejarla encolada para cuando exista.
  if (!apiKey) {
    return new Response(JSON.stringify({ sent: 0, skipped: "email_no_configurado" }), { status: 200 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  // Reclama la cola de forma atómica (marca enviado=true al leer → sin doble envío).
  const { data: filas, error } = await supabase.rpc("claim_emails", { p_limit: 50 });
  if (error) return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  if (!filas?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

  const fallidos: string[] = [];
  for (const f of filas) {
    try {
      const r = await fetch(RESEND_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [f.email], subject: f.titulo, html: f.cuerpo_html }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!r.ok) throw new Error(`resend ${r.status} ${(await r.text()).slice(0, 300)}`);
    } catch (e) {
      console.error("envío falló", f.id, e);
      fallidos.push(f.id);
    }
  }

  // Las que fallaron vuelven a la cola para el próximo reintento del cron.
  if (fallidos.length) await supabase.rpc("desclamar_emails", { p_ids: fallidos });

  return new Response(JSON.stringify({ sent: filas.length - fallidos.length, failed: fallidos.length }),
                      { status: 200 });
});
```

Deploy: `supabase functions deploy <nombre>` (or MCP `deploy_edge_function`). Keep
`verify_jwt = true`: the gateway validates that a JWT comes in, & the service_role check from inside
restricts to exactly that key.

**Note on `FROM`:** several providers/dashboards split "Sender name" & "Sender email"
into two fields. In the code constant → **a single string** in format `Nombre <email>`,
e.g. `Mi App <no-reply@midominio.com>`.

---

## 5. Los secrets

### 5.1 Secrets de la Edge Function (dashboard)

> Si el remitente es el servidor de Netlify (no una Edge Function), la misma clave `RESEND_API_KEY`
> se carga en Netlify como secreto (scopes Functions y Runtime, «Contains secret values»). La clave del
> SMTP de Supabase (#1) es otra y no se toca desde acá.

**Where:** Dashboard → Project Settings → Edge Functions → **Secrets**
(or CLI: `supabase secrets set RESEND_API_KEY=re_...`).

**One secret only, the same name in every project: `RESEND_API_KEY`.**

Everything else is **⊥ secret & ⊥ changes** → constant in the function (§4), versioned in git:

| Constante | Valor | Por qué ⊥ es secret |
|---|---|---|
| `RESEND_URL` | `https://api.resend.com/emails` | Public, same for every Resend account |
| `FROM` | `Mi App <no-reply@midominio.com>` | Public (the recipient sees it); changes = a reviewable commit |

**Rule:** a secret = what would hurt if it leaked. A value shipped in every mail header ⊥ is one.
Fewer secrets = fewer things to load in each environment (& to forget in one).

**Never in the repo:** the key itself (`.env`, migrations, docs). Gitleaks in pre-commit catches `re_...`.

`SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` **⊥** load them: Supabase injects them itself
into the runtime of every Edge Function.

### 5.2 Secret en Vault (autoriza al trigger a llamar la función)

**Where:** SQL Editor.

```sql
select vault.create_secret('<SERVICE_ROLE_KEY>', 'email_service_role_key');
```

`<SERVICE_ROLE_KEY>` is in Dashboard → Project Settings → API Keys → `service_role`.

**Why:** the Edge Function demands the service_role key in the header. The DB ⊥ knows it by itself,
the trigger reads it from Vault at runtime. **Without this secret → trigger ⊥ authenticates → ⊥ calls the function
→ ⊥ anything gets sent** (stays queued).

Verify: `select count(*) from vault.secrets where name='email_service_role_key';` → ! yield 1.

**⊥ hardcode it in a migration**: the migration ends up in git & the service_role key = max-privilege
key of the project. Vault stores it encrypted.

---

## 6. La plomería en la DB (RPCs + trigger + cron)

```sql
-- Reclama la cola atómicamente. SKIP LOCKED evita que dos invocaciones se pisen.
-- Solo service_role puede ejecutarla.
create or replace function public.claim_emails(p_limit int default 50)
returns table(id uuid, email text, titulo text, cuerpo_html text)
language plpgsql security definer set search_path to 'public' as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true),'')::jsonb->>'role','') <> 'service_role'
    then raise exception 'solo service_role'; end if;
  return query
  with pend as (
    select e.id from public.emails_cola e
    where e.requiere_email and not e.email_enviado
    order by e.created_at limit p_limit for update skip locked
  ), claimed as (
    update public.emails_cola e set email_enviado = true
    from pend where e.id = pend.id
    returning e.id, e.email, e.titulo, e.cuerpo_html
  ) select * from claimed;
end $$;
revoke execute on function public.claim_emails(int) from public, anon, authenticated;
grant  execute on function public.claim_emails(int) to service_role;

-- Devuelve a la cola las que fallaron el envío.
create or replace function public.desclamar_emails(p_ids uuid[])
returns void language sql security definer set search_path to 'public' as $$
  update public.emails_cola set email_enviado = false where id = any(p_ids) and requiere_email;
$$;
revoke execute on function public.desclamar_emails(uuid[]) from public, anon, authenticated;
grant  execute on function public.desclamar_emails(uuid[]) to service_role;

-- "Kick": si hay cola pendiente y hay key en Vault, POST a la función. NUNCA lanza:
-- un fallo acá jamás debe romper la transacción de negocio que insertó el email.
create or replace function public.emails_kick()
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_key text;
begin
  if not exists (select 1 from public.emails_cola where requiere_email and not email_enviado)
    then return; end if;
  select decrypted_secret into v_key from vault.decrypted_secrets
    where name = 'email_service_role_key' limit 1;
  if v_key is null then return; end if;  -- sin secret: no-op, la cola espera
  perform net.http_post(
    url := 'https://<TU_PROJECT_REF>.supabase.co/functions/v1/<nombre-funcion>',
    headers := jsonb_build_object('Content-Type','application/json',
                                  'Authorization','Bearer ' || v_key),
    body := '{}'::jsonb, timeout_milliseconds := 10000);
exception when others then null;  -- jamás romper la transacción que emitió el email
end $$;

-- Trigger statement-level: un solo POST por INSERT (aunque el INSERT meta N filas).
create or replace function public.trg_emails_kick()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if exists (select 1 from new_rows where requiere_email) then perform public.emails_kick(); end if;
  return null;
exception when others then return null;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'emails_dispatch') then
    create trigger emails_dispatch after insert on public.emails_cola
      referencing new table as new_rows for each statement
      execute function public.trg_emails_kick();
  end if;
end $$;

-- Cron de reintento (cada 15 min). No-op si la cola está vacía o falta el secret.
create extension if not exists pg_cron;
do $$ begin
  if not exists (select 1 from cron.job where jobname = 'emails_retry') then
    perform cron.schedule('emails_retry', '*/15 * * * *', 'select public.emails_kick()');
  end if;
end $$;
```

**Details that matter:**
- `for update skip locked` in the claim: without it, trigger & cron at the same time → same mail twice.
- `kick` & trigger **swallow every exception** (`exception when others`): the send = side effect;
  `pg_net` | Vault fail → business operation ! stay intact.
- **Statement-level** trigger with transition table (`new_rows`): an INSERT adding 5 recipients
  fires **one** POST, ⊥ five.

---

## 7. Complicaciones reales que vas a encontrar (y cómo diagnosticarlas)

### 7.1 "La función responde `sent:1` sin error pero el mail no llega" ← el más común

The send went fine from your side (the provider accepted it), but the provider **⊥ delivered it**. Almost always:

- **Unverified sender domain.** `FROM` uses a domain not verified at the provider
  (no SPF/DKIM) → provider may accept the mail & then ⊥ deliver it, | the recipient (Gmail, Outlook)
  rejects it. **Fix:** verify the domain at the provider (Domains → load the DNS TXT/CNAME records
  it gives you: SPF, DKIM & ideally DMARC — recipe: `dns-email-dominio.md`).
- **Recipient filter.** Corporate mailboxes (Google Workspace / Microsoft 365 with their own rules)
  sometimes silently drop mail from new domains | unknown brands, even well
  configured. Recipient side, ⊥ your config.

**How to isolate it fast:** send the same test from the **provider's sandbox domain**
(Resend: `onboarding@resend.dev`, already verified) to a **Gmail/personal** mailbox. That one arrives & yours ⊥
→ your domain is unverified. Gmail arrives & the corporate one ⊥ → recipient filter.

### 7.2 "El trigger no dispara nada"

- Vault secret loaded? (`select count(*) from vault.secrets where name=...`).
  Without it → `emails_kick` no-op.
- `pg_net` installed? Does the `http_post` `url` point to the correct project ref?
- Look at the POST response: `select status_code, content, error_msg from net._http_response
  order by created desc limit 5;`.

### 7.3 "401 unauthorized al llamar la función"

- `Authorization` header ⊥ matches the service_role key. Is the Vault secret = current key (⊥ rotated)?
  Is `verify_jwt` fighting your header? (with the service_role key the gateway accepts it as a valid JWT).

### 7.4 Ver los logs de la Edge Function

Dashboard → Edge Functions → your function → Logs. Distinguish:
- **Invocation** logs (request/response, status).
- **Runtime** logs (your `console.log`/`console.error` from inside). `client.send` fails →
  your `console.error` shows up here. ⊥ shows up → provider accepted & the problem is delivery (§7.1).

### 7.5 MCP del proveedor (opcional, para diagnosticar entregas)

Some providers (Resend) offer an MCP server to query send logs from the assistant.
Added with `claude mcp add --transport http <nombre> <url>`, but it requires **approval + authentication**
in an interactive session (`/mcp`) before its tools are available. ⊥ needed for the system
to work; it only helps see delivery states.

---

## 8. Checklist de puesta en marcha

1. [ ] Resend with **verified domain** (SPF + DKIM in DNS). ← don't skip it
2. [ ] API key (Sending access, one domain) generated and **written down**.
3. [ ] `RESEND_API_KEY` loaded as the **only** secret; endpoint & `FROM` as constants in the function.
4. [ ] Edge Function deployed (`verify_jwt = true`).
5. [ ] `pg_net` and `pg_cron` installed.
6. [ ] RPCs `claim` / `desclamar`, `kick` function, trigger and cron created (migration).
7. [ ] Vault secret with the `service_role_key` (`vault.create_secret`). Verified with count = 1.
8. [ ] Test: insert a row into the queue → confirm `net._http_response` 200 and the mail arriving.
9. [ ] If it doesn't arrive: isolate with sandbox domain + Gmail mailbox (§7.1).

---

## 9. Resumen de por qué el diseño es así

| Decisión | Motivo |
|---|---|
| Cola persistente con flags | Don't lose mails if the provider fails; idempotent retry. |
| Trigger + `pg_net` | Low latency: the mail goes out as soon as the event happens. |
| Cron de reintento | Safety net if the trigger or the provider failed at the moment. |
| Claim atómico `SKIP LOCKED` | Avoids double send between concurrent trigger and cron. |
| `kick`/trigger tragan excepciones | The send can never break the business operation. |
| service_role key en Vault | Critical secret out of git; the trigger reads it encrypted. |
| `RESEND_API_KEY` secret (resto = constantes) | Auth's SMTP is not accessible from Edge Functions. Only the key is secret. |
| Verificar el dominio | Without SPF/DKIM the provider accepts but doesn't deliver (trap #1). |
