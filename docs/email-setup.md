# Email setup (Resend)

Step by step for the pass email and the one-time code on `/pase` (spec: [`2026-10-06-pass-email-design.md`](superpowers/specs/2026-10-06-pass-email-design.md)).

The emails are sent by the Supabase edge functions (`registration-pass` and `admin-pin`), never by Vercel or the browser. That is why **every variable here is a Supabase secret, and Vercel gets nothing new.**

Never paste the API key in chat, in the repo or in a `NEXT_PUBLIC_*` variable.

## 1. Resend account

1. Sign up at [resend.com](https://resend.com). The free plan allows 3,000 emails a month, **at most 100 a day**.
2. Turn on two-factor authentication (Settings → Account). Whoever gets into this account can send email as the event.

## 2. Domain: `socialrun.site` (bought on Vercel)

The domain and its DNS live in Vercel. Emails go out from the subdomain `mail.socialrun.site`, which keeps the reputation of the main domain apart.

### 2a. Point the site at the domain

1. **Vercel → project → Settings → Domains → Add:** `socialrun.site`.
2. Accept adding `www.socialrun.site` as well, redirecting to `socialrun.site`.

Vercel creates the web records itself, because it is also the DNS host.

### 2b. Verify the sending subdomain in Resend

Without a verified domain, Resend only delivers to the account owner's own address.

1. **Resend → Domains → Add domain:** `mail.socialrun.site`. Region: `us-east-1` (the default).
2. Resend lists three records. Add each one in **Vercel → Domains → `socialrun.site` → DNS Records → Add**.
   - Vercel's **Name** field takes only the part before `socialrun.site`, the same as the table below.
   - Copy the **Value** from Resend; it is long and unique to the account.
   - For the MX record, set the priority Resend shows (usually `10`).

   | Type | Name (in Vercel) | Value | Purpose |
   |------|------------------|-------|---------|
   | `TXT` | `resend._domainkey.mail` | `p=MIGf…` (from Resend) | DKIM: signs each email |
   | `MX` | `send.mail` | `feedback-smtp.us-east-1.amazonses.com` (from Resend), priority `10` | Bounce handling |
   | `TXT` | `send.mail` | `v=spf1 include:amazonses.com ~all` (from Resend) | SPF: authorizes Resend to send |

3. Add DMARC (Gmail and Yahoo require it for good delivery), replacing the address with an inbox you read:

   | Type | Name (in Vercel) | Value |
   |------|------------------|-------|
   | `TXT` | `_dmarc.mail` | `v=DMARC1; p=none; rua=mailto:your-inbox@example.com` |

4. **Resend → Verify DNS records.** On Vercel DNS it usually takes minutes; wait for **Verified** on all records.

**Check from a terminal** (each command must answer with the value you pasted):

```bash
dig +short TXT resend._domainkey.mail.socialrun.site
dig +short MX send.mail.socialrun.site
dig +short TXT send.mail.socialrun.site
dig +short TXT _dmarc.mail.socialrun.site
```

## 3. API key

1. **API Keys → Create API key.**
   - Name: `neoteam-social-run-supabase`.
   - Permission: **Sending access** (not Full access).
   - Domain: only `mail.socialrun.site`.
2. Copy it. Resend shows it only once; it starts with `re_`.

## 4. Supabase secrets

| Secret | Value | Example |
|--------|-------|---------|
| `RESEND_API_KEY` | The key from step 3 | `re_…` |
| `EMAIL_FROM` | Sender name and address on the verified subdomain | `NeoTeam Social Run <pase@mail.socialrun.site>` |
| `SITE_URL` | Public URL of the site, with no trailing slash, used in the `/pase` link | `https://socialrun.site` |

**Option A: the dashboard.** Supabase → project → Edge Functions → **Secrets** → add the three.

**Option B: the CLI, keeping the key out of your shell history.** Write a temporary file outside the repo:

```bash
cat > ~/neoteam-email.env <<'EOF'
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=NeoTeam Social Run <pase@mail.socialrun.site>
SITE_URL=https://socialrun.site
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
