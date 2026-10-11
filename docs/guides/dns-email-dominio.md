# Verificar un dominio para enviar email (Resend + Netlify DNS + NIC.ar)

> **Generic** recipe. Takes a domain bought at **NIC.ar** whose DNS is delegated to **Netlify**, and
> leaves it able to send mail through **Resend** (SPF + DKIM + DMARC). Same steps work for any
> provider/registrar: only the panel where you type the records changes.
> Companion of `transactional-emails.md` (that one = the code; this one = the DNS).

---

## 0. Where the records go — find out first, ⊥ assume

The **registrar** (NIC.ar) only says *who* answers for the domain. The **records** live with that "who".
NIC.ar ⊥ host records at all → there is nothing to load there.

```powershell
nslookup -type=ns midominio.com.ar 8.8.8.8
```

| Nameservers you see | Records go in |
|---|---|
| `dns1.pXX.nsone.net` … `dns4.pXX.nsone.net` | **Netlify** (Netlify DNS runs on NS1) |
| `*.ns.cloudflare.com` | Cloudflare |
| anything else | whoever that is |

Real case (2026-10): `guarnold.com.ar` → `dns1..4.p02.nsone.net` ∴ Netlify.

---

## 1. Resend: add the domain

1. resend.com → **Domains** → **Add Domain** → `midominio.com.ar`. Region: the closest to the users
   (it ⊥ change later without re-adding).
2. Resend shows the table to load. Today (2026-10) it looks like this:

| Bloque | Type | Name | Content | Para qué |
|---|---|---|---|---|
| Domain Verification (DKIM) | TXT | `resend._domainkey` | `p=MIGfMA…wIDAQAB` | Signs each mail → proves it's yours |
| Enable Sending (SPF) | CNAME | `rsend` | `rsend-sa…mta.net` | Return-path / SPF of the bounces |
| Enable Sending (SPF) | CNAME | `send` | `send.for…mta.net` | Idem |
| DMARC (optional) | TXT | `_dmarc` | `v=DMARC1; p=none;` | Policy for receivers. **Load it anyway** (see §4) |

⚠️ The panel **truncates** values (`[…]`). ⊥ retype them: use the **copy button** of each cell.
⚠️ Older Resend accounts gave `MX send` + `TXT send` instead of the 2 CNAMEs. Load **what your panel
shows**, ⊥ what this table says.

---

## 2. Netlify: load the records

1. app.netlify.com → **Domains** (team menu, ⊥ inside a site) → click the domain.
2. **DNS settings** → **Add new record**, once per row:
   - **Record type**: TXT / CNAME.
   - **Name**: **only the host part** → `resend._domainkey`, `rsend`, `send`, `_dmarc`.
     Netlify appends `.midominio.com.ar` itself. Typing the full name gives
     `resend._domainkey.midominio.com.ar.midominio.com.ar` → verification never passes.
   - **Value**: the copied content, **without quotes** and without spaces at the ends.
   - **TTL**: leave the default (Resend's "Auto" ≡ whatever the panel puts).
3. Save. Nothing else to touch in Netlify (the sites keep working: these names ⊥ collide with `@`/`www`).

Traps:
- **CNAME ⊥ coexist** with any other record of the same name. If `send` already exists (old MX/TXT
  from a previous attempt) → delete it first.
- **One SPF per name.** If the domain already sends mail from another provider (Google Workspace…)
  and the panel asks for a `TXT v=spf1` at the same name, **merge** into one line — 2 SPF = both fail.
  With the CNAME scheme it ⊥ applies, it's for the old MX/TXT one.

---

## 3. Verify

Back in Resend → the domain → **Verify DNS Records**. Netlify DNS propagates in minutes; up to 1-2 h
is normal. Each row turns *Verified*.

Check from the terminal without waiting for the panel:

```powershell
nslookup -type=txt   resend._domainkey.midominio.com.ar 8.8.8.8
nslookup -type=cname rsend.midominio.com.ar 8.8.8.8
nslookup -type=cname send.midominio.com.ar 8.8.8.8
nslookup -type=txt   _dmarc.midominio.com.ar 8.8.8.8
```

`Non-existent domain` on one → the name was typed wrong (see §2, the duplicated suffix) | ⊥ propagated yet.

Then: send a test with `from: no-reply@midominio.com.ar` to a Gmail → open it → **⋮ → Show original**:
`SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`. That's the real proof; the green panel ⊥ is.

---

## 4. DMARC: why load the "optional" one

- Gmail/Yahoo require DMARC for anyone sending in volume since 2024; without it, mail from a new domain
  goes to spam more easily.
- `p=none` = "don't block anything, just watch". Zero risk to start.
- Later, with weeks of clean sending: `p=quarantine`, and add `rua=mailto:dmarc@midominio.com.ar`
  if you want the daily reports (needs a mailbox that receives them).

---

## 5. Checklist to replicate on another domain

1. [ ] `nslookup -type=ns` → know which panel holds the records.
2. [ ] Resend → Add Domain → copy the 4 rows **with the copy button**.
3. [ ] Netlify → Domains → DNS settings → 4 records, **Name without the domain**.
4. [ ] Resend → Verify. `nslookup` of the 4 if it hangs.
5. [ ] Test mail to Gmail → *Show original* → SPF/DKIM/DMARC PASS.
6. [ ] Only then: the two keys (`secretos-y-configuracion.md` § Email): clave #1 in Supabase SMTP,
       clave #2 (`RESEND_API_KEY`) in the server that sends its own mails (`transactional-emails.md` §3).

---

## 6. Después de verificar: quién usa el dominio

Verificar el dominio habilita a Resend a enviar **desde** él. Quién envía es otra decisión:

| Remitente | Dónde se configura | Clave |
|---|---|---|
| Mails de Auth (confirmación, recuperación, avisos de seguridad) | Supabase → Authentication → SMTP Settings: `smtp.resend.com`, puerto `465`, usuario `resend`, sender `Nombre <no-reply@tudominio>` | #1 (restringida al dominio) |
| Mails propios del servidor (invitaciones, avisos de la app) | Secreto `RESEND_API_KEY` en Netlify o en Supabase, según dónde corra el código | #2 |

- Un solo dominio verificado sirve para los dos. No hace falta un registro DNS extra por cada canal.
- Si el sender no pertenece a un dominio verificado, el mail se acepta y después no llega. Es el error
  más caro de diagnosticar: revisar primero que el dominio del `from` sea el verificado.
- Cuando el dominio ya manda en volumen, subir DMARC de `p=none` a `p=quarantine` (§4) es el paso que
  sigue, no un cambio de clave.
