# Pass by email and OTP to claim it — spec

Date: 2026-10-06 · Branch: `feat/staff-and-email` · Status: **draft**, waiting for Iván's OK

## Problem

Iván, 2026-10-06: improve the email OTP and send each runner's QR by email.

Today the site sends **no email at all**:
- `/pase` shows the pass to anyone who types a document number and the email that go with it (`registration-pass`, action `claim`). Nothing proves the person owns that inbox;
- the QR only exists on screen, after registering or on `/pase`.

## Decisions

1. **Provider: Resend** (Iván, 2026-10-06).
   - Free plan: 3,000 emails a month, but **capped at 100 a day**.
   - Called through its REST API with `fetch`, so no new dependency.
   - Cloudflare Email Service was set aside: it needs Workers Paid and the domain's DNS on Cloudflare, and it is still in beta.
2. **Email is sent from the Supabase edge functions,** never from the browser:
   - the API key is a function secret;
   - the OTP and the registration row need the service role anyway.
   - New `supabase/functions/_shared/email.ts`: `sendEmail()` (a POST to `https://api.resend.com/emails`) plus the two templates (code and pass).
   - **Secrets** (Supabase, never Vercel or `NEXT_PUBLIC_*`):
     - `RESEND_API_KEY`;
     - `EMAIL_FROM`, e.g. `NeoTeam Social Run <pase@dominio>`;
     - `SITE_URL`.
3. **The QR goes in the email as an inline image** (`cid:pass-qr`, a Resend attachment with `content_id`):
   - Gmail and Outlook do not render SVG or `data:` images;
   - the image is a GIF from `qrcode-generator`'s `createDataURL` (the library the site already uses, loaded from esm.sh in Deno), so no new npm dependency;
   - it encodes the same `NEOTEAM-SR26:<checkin_token>` the scanner reads.
4. **Pass email ("Tu pase para el NeoTeam Social Run").** It contains:
   - the runner's name, the QR, the code `SR26-xxxxx`, date, time and place, and a link to `/pase`;
   - an HTML version and a plain-text version.
   - It is sent:
     - **after registering:** the registration server action asks `registration-pass` (`sendPass`) to send it. The function sends only if the row was created less than 15 minutes ago and has no `pass_emailed_at`, so this public path cannot be used to spam a runner. A failed email never fails the registration; the success screen still shows the pass.
     - **from the admin:** a "Reenviar pase" button on each participant (new `admin-pin` action `resendPass`, admin only).
5. **OTP to claim the pass on `/pase`:**
   1. The runner enters document and email. If they match a registration that is not cancelled, the function emails a 6-digit code.
      - The answer is always "Si los datos coinciden, te enviamos un código", so the form cannot be used to probe who registered.
   2. The runner enters the code (the same six-box field style as the admin PIN) and gets the pass.
   - New table `pass_email_codes`:
     - columns: `registration_id`, `code_hash` (SHA-256), `expires_at`, `attempts` and `used_at`;
     - RLS on, no grants.
   - **Limits:**
     - a code lasts 10 minutes and works once;
     - 5 wrong tries burn it;
     - at most 3 codes per registration in 15 minutes.
   - `registrations` gains `pass_emailed_at timestamptz`.
6. **The 100-a-day cap.** Each registration uses one email, and each claim on `/pase` one more.
   - If a peak day goes past ~80 emails, Resend Pro is needed (50,000 a month).
   - The function logs Resend's 429 response and shows "No pudimos enviar el correo, intenta más tarde" instead of failing silently.
   - Sending to everyone at once is out of scope for this reason.

## Alternatives rejected

- **Cloudflare Email Service:** see decision 1.
- **Brevo (300 a day free) or Mailjet (200 a day):** more free volume but heavier APIs and branding. Iván chose Resend.
- **Sending from the Next server:** the API key would be a Vercel variable as well, and the OTP still needs the service role in the edge function.
- **A hosted QR image URL** (`/api/qr/<token>.png`): the token would travel in an image URL that email clients and proxies fetch and cache. An inline attachment keeps it inside the message.
- **A magic link in place of a code:** links break when opened in another browser (Instagram, the Gmail in-app browser), and a code can be typed on the same phone.

## Mobile

- Designed at 390 px first:
  - the code step uses `inputmode="numeric"` and `autocomplete="one-time-code"`, so iOS and Android offer the code from the email;
  - "Reenviar código" is a 44 px button, enabled after 60 seconds.
- **Email layout:** one 600 px column that shrinks to the phone width, with a QR of at least 240 px so it scans from a screen.
- **Admin:** "Reenviar pase" sits on the participant card as a 44 px button.

## Security

- `RESEND_API_KEY` exists only as a Supabase function secret.
- OTP codes are stored hashed, expire, are single-use and are rate-limited per registration; the answer never reveals whether a registration exists.
- The public `sendPass` path cannot be used to send arbitrary email: it only sends to the registration's own address, once, right after it is created.
- The email contains the check-in QR; whoever reads the inbox has the pass, the same as with today's screen.

## Needed from Iván before implementing

- **The sending domain,** verified in Resend: the SPF and DKIM DNS records go on any DNS host, not only Cloudflare. Without it, Resend only delivers to the account owner's own address.
- **The secrets** set with `supabase secrets set` (he runs it).
- **The expected number of registrations,** to know whether the free plan is enough.

## Out of scope

- Bulk send to all participants.
- A Google Wallet button inside the email.
- Reminders before the event.
