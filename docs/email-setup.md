# Email setup (Resend)

Step by step for the pass email and the one-time code on `/pase` (spec: [`2026-10-06-pass-email-design.md`](superpowers/specs/2026-10-06-pass-email-design.md)).

The emails are sent by the Supabase edge functions (`registration-pass` and `admin-pin`), never by Vercel or the browser. That is why **every variable here is a Supabase secret, and Vercel gets nothing new.**

Never paste the API key in chat, in the repo or in a `NEXT_PUBLIC_*` variable.

## 1. Resend account

1. Sign up at [resend.com](https://resend.com). The free plan allows 3,000 emails a month, **at most 100 a day**.
2. Turn on two-factor authentication (Settings → Account). Whoever gets into this account can send email as the event.

## 2. Verify the sending domain

Without a verified domain, Resend only delivers to the account owner's own address.

1. **Domains → Add domain.**
   - Use a subdomain, e.g. `mail.yourdomain.com`, so the main domain's reputation stays apart.
   - Region: `us-east-1` (the default) is fine.
2. Resend shows the DNS records. Add them at your DNS host (Cloudflare, Vercel, GoDaddy, wherever the domain lives), exactly as shown:

   | Type | Name | Purpose |
   |------|------|---------|
   | `TXT` | `resend._domainkey.mail` | DKIM: signs each email |
   | `MX` | `send.mail` | Bounce handling |
   | `TXT` | `send.mail` | SPF: authorizes Resend to send |

   On Cloudflare, set the records to **DNS only** (grey cloud), not proxied.
3. Add DMARC, which Gmail and Yahoo require for good delivery:

   | Type | Name | Value |
   |------|------|-------|
   | `TXT` | `_dmarc.mail` | `v=DMARC1; p=none; rua=mailto:you@yourdomain.com` |

4. Back in Resend, click **Verify DNS records**. It can take from minutes up to a few hours. Wait for the status **Verified**.

## 3. API key

1. **API Keys → Create API key.**
   - Name: `neoteam-social-run-supabase`.
   - Permission: **Sending access** (not Full access).
   - Domain: only the domain from step 2.
2. Copy it. Resend shows it only once; it starts with `re_`.

## 4. Supabase secrets

| Secret | Value | Example |
|--------|-------|---------|
| `RESEND_API_KEY` | The key from step 3 | `re_…` |
| `EMAIL_FROM` | Sender name and address on the verified domain | `NeoTeam Social Run <pase@mail.yourdomain.com>` |
| `SITE_URL` | Public URL of the site, with no trailing slash, used in the `/pase` link | `https://neoteam-social-run.vercel.app` |

**Option A: the dashboard.** Supabase → project → Edge Functions → **Secrets** → add the three.

**Option B: the CLI, keeping the key out of your shell history.** Write a temporary file outside the repo:

```bash
cat > ~/neoteam-email.env <<'EOF'
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=NeoTeam Social Run <pase@mail.yourdomain.com>
SITE_URL=https://neoteam-social-run.vercel.app
EOF
supabase secrets set --env-file ~/neoteam-email.env --project-ref ohatsnkgaeccltqwhkbv
rm ~/neoteam-email.env
```

Check that they exist (this lists names and digests, never values):

```bash
supabase secrets list --project-ref ohatsnkgaeccltqwhkbv
```

Secrets take effect without a redeploy, but the functions need the new code (step 6).

## 5. Migration

When the email PR is ready, run its migration (`supabase/migrations/<ts>_pass_email.sql`) in the SQL editor:
1. first inside `begin; … rollback;` to check it;
2. then for real.

It creates `pass_email_codes` and adds `registrations.pass_emailed_at`.

## 6. Deploy the functions

Migration first, then the functions. The other order breaks the claim flow until the table exists.

```bash
supabase functions deploy registration-pass admin-pin --project-ref ohatsnkgaeccltqwhkbv
```

## 7. Go-live check

On a phone:
1. Register with your own email:
   - the email "Tu pase para el NeoTeam Social Run" arrives;
   - the QR is visible in Gmail;
   - it scans in the admin's Check-in.
2. On `/pase`, enter document and email:
   - the 6-digit code arrives;
   - the keyboard offers it from the email;
   - the pass opens.
3. In the admin, under Participantes → **Reenviar pase**, it arrives again.
4. In Resend → **Logs**, each send shows `delivered`. If one went to spam, check that DMARC exists and the domain is Verified.

## Limits and errors

- **100 emails a day on the free plan.** Each registration uses one, and each code on `/pase` another. If more than ~80 registrations a day are expected, move to Resend Pro before that day.
- **Over the limit:** Resend answers 429. The function logs `email 429`, and the runner sees "No pudimos enviar el correo, intenta más tarde". The registration still goes through, and the pass still shows on screen.
- **Logs:** the function log only shows `email <status>`; Resend's response body never reaches the browser.
- **Key leak:** revoke the key in Resend → API Keys, create a new one, and repeat step 4.
