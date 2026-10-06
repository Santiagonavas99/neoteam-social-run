# QR pass and check-in — spec

Date: 2026-10-05 · Branch: `feat/qr-checkin` (from `main` after `fix/registration-form`) · Status: **awaiting OK**

Source: Santiago's `feat/qr-wallet-checkin`. The QR, pass recovery and check-in parts are ported here. Wallet has its own spec (`2026-10-05-wallet-passes-design.md`).

## Problem

On 18 Oct, staff check runners in at 7:30 a. m. from their phones. Today the only way is to search for each name in "Participantes" and tap "Check-in", which is too slow for a queue.

Santiago built the right flow (a QR per registration, a scanner for staff, and a page to recover the pass), but it cannot be merged:
- **It predates the `features/` structure.** It writes to `app/admin/*`, `app/registro/*` and `lib/`, and it is 69 commits behind `main`.
- **`admin-checkin` is a new Edge Function that skips the hardening on `main`.** It accepts calls without `x-admin-proxy-secret`, so anyone holding a session token can call it straight from the internet. It also repeats the session check that `admin-pin` already has.
- **`/admin/checkin` is a separate page** with its own copy of the login check (`validate` against `localStorage`), and it is reached through a floating "Escáner QR ↗" link.
- **The QR is drawn in the browser.** That ships `qrcode-generator` to every phone that registers.
- **It uses legacy CSS** in a new global stylesheet (`app/checkin-wallet.css`, 30+ raw hex colors). Both the Tailwind spec and `DESIGN.md` rule 9 forbid this.

## State to verify first (Task 0)

`main` already has part of the backend: `admin-pin`'s `dynamicData` → `complete` looks participants up by `registrations.checkin_token`. So the column probably exists in the remote project already, but no migration in this repo creates it.

Before coding, Iván runs these read-only queries in the Supabase SQL editor:

```sql
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'registrations' and column_name = 'checkin_token';

select indexname from pg_indexes
where schemaname = 'public' and tablename = 'registrations' and indexdef ilike '%checkin_token%';
```

He also checks **Dashboard → Edge Functions** for `registration-pass`, `admin-checkin` and `apple-wallet-pass`.
- If they are deployed, they are live and open (no proxy secret).
- This plan replaces `registration-pass` and deletes `admin-checkin`.

- **If the column exists:** Santiago's migration `20261005195000_add_registration_checkin_token.sql` is added to the repo as is, for history. It is idempotent (`if not exists`) and is not run again.
- **If the column does not exist:** the same migration is run on the remote, from this approved plan (a new migration, not an initial schema).

## Decisions

1. **The QR carries `NEOTEAM-SR26:<checkin_token>`**, as in Santiago's branch and in what `admin-pin` already parses.
   - The token is a random UUID, separate from the sequential `SR26-xxxxx` code, so the code is not enough to forge a QR.
   - The visible code stays as the manual fallback.
2. **The QR is drawn on the server.**
   - `qrcode-generator` (new dependency, 2.0.4, no dependencies of its own, last release Aug 2025) runs only inside server actions.
   - It returns an SVG string with the action's result, so phones that register download no QR code.
   - **Rejected:** drawing it in the browser, as Santiago did. That costs bytes on every participant's phone for something the server can do once.
3. **One Edge Function for participant passes: `registration-pass`**, Santiago's function plus the `main` hardening.
   - It requires `x-admin-proxy-secret`, like `admin-pin`, so only the Next server can call it. The browser never calls it.
   - `claim` takes the document and email, plus the code when it is known, and returns the code, `checkin_token`, the name and the status.
   - Not found and email mismatch return the same generic 404.
   - Next calls it through a small server-only helper, `lib/edge-function.ts` (`callEdgeFunction(name, body)`), which reuses the headers built in `lib/admin-proxy.ts`.
4. **After registration, the success card shows the pass:**
   - the QR, the `SR26-xxxxx` code and the runner's name;
   - "Toma una captura de pantalla: es tu entrada para el check-in.".
   - A screenshot is the zero-cost wallet. Real Wallet passes are spec 4.
   - If `claim` fails after a successful registration, the card still shows the code with "Tu QR estará en /pase.". The registration is never reported as failed.
5. **`/pase` recovers the pass** for runners who registered before this ships, which is everyone today.
   - Fields: document number and email, the same pair used to register.
   - Same layout as `/registro`, with `BrandLink`. The page is a server component plus a client form.
   - Links to it:
     - "Mi pase" in the site header nav (desktop);
     - "¿Ya te inscribiste? Recupera tu pase" on `/registro`;
     - in the home hero, next to "Quiero participar", as a text link.
   - `noindex` metadata.
6. **Check-in is a new admin section, not a separate page.**
   - It is called "Check-in", uses the `UserCheck` icon and sits first in the nav. On event day it is the screen staff open.
   - It lives inside `AdminApp`, so it reuses the session, the shell and the sign-out. There is no second login check.
   - **Rejected:** `/admin/checkin` as its own route. It duplicates auth, and staff would bounce between two pages.
7. **Check-in goes through the `checkin` action on `admin-pin`**, not a new function. It inherits the proxy secret, the session check and the IP rate limit, through the `/api/admin` route.
   - It is atomic: `update registrations set status = 'checked_in', checked_in_at = now() where event_id = … and (checkin_token = … or registration_code = …) and status = 'registered' returning …`.
   - If no row is updated, it re-reads the row to report what happened:
     - already checked in, with the time;
     - cancelled;
     - not found.
   - Two staff phones scanning the same QR can never check the runner in twice.
   - It returns the name, the code, the group, the status and `checked_in_at`.
8. **Scanner: `html5-qrcode` (new dependency), loaded only on the check-in screen** with `import()`. It is never part of a public page.
   - **Rejected:** `BarcodeDetector`, the native API. Safari on iPhone does not have it, and staff phones may be iPhones.
   - Its bundle size is measured in Task 4 and noted in the PR.
   - **Risk:** its last release is 2.3.8 (Apr 2023), so it is not actively maintained. It still works in current Safari and Chrome, and it is isolated behind `qr-scanner.tsx`. If the real-phone test in Task 4 fails, the fallback is `BarcodeDetector` on Android plus manual code entry, decided then with Iván.
   - The scanner is a shared block, `features/admin/ui/qr-scanner.tsx` (`onScan(text)`), because the dynamics panel (spec 3) scans the same QR at stands.
9. **The screen at 390 px:**
   - the camera on top, at full width;
   - a large result card under it;
   - a "Código manual" field below that, for the `SR26-xxxxx` fallback.
   - The scanner keeps running between reads. The same QR is ignored for 5 s, so a phone held still does not repeat.
   - **Results:**

     | Case | Shown as |
     |------|----------|
     | Checked in | success, `CircleCheck`, name and group in large text, `navigator.vibrate(80)` where supported |
     | Already checked in | neutral, `Clock`, "Ya hizo check-in a las 7:41 a. m." |
     | Cancelled | danger, `CircleX` |
     | Not found | danger, `CircleAlert`, "No encontramos ese QR o código." |

   - Built with Tailwind utilities on the `--neo-*` tokens, no legacy CSS. It therefore works in the admin dark theme when that lands.
10. **Times are shown in Colombia time** with `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', timeStyle: 'short' })`. This follows decision 9 of the Tailwind spec.
    - The helper lives in `features/event/datetime.ts`, the shared kernel, rather than `lib/`, which holds infrastructure only.

**Ported from Santiago:** the `checkin_token` migration, the QR payload, the `registration-pass` logic, the `/pase` copy, and the result states.

**Dropped:** the `admin-checkin` function and its route, `/admin/checkin`, the floating link, `app/checkin-wallet.css`, and client-side QR drawing.

## Security

- **The browser talks only to:**
  - the server actions (`registerParticipant`, `claimPass`);
  - `/api/admin`.
- **Both Edge Functions require the proxy secret.** No new secret: `ADMIN_PROXY_SECRET` already exists in Vercel and in Supabase.
- **`claim` needs the document and email together**, so it cannot be used to list people.
  - What it reveals is a pass. A pass only lets staff check that person in, and staff check in people who are physically there.
  - `ponytail:` no rate limit on `/pase`. If abuse shows up in the logs, add an IP limit with `admin_pin_reserve_attempt`'s table pattern.
- `checkin_token` is never logged and never put in a URL in this spec.

## Mobile

- **Participants, at 390 px:**
  - after registering, the QR is at least 240 px and fits on screen with the code;
  - `/pase` works with the keyboard open;
  - no new client JavaScript on public pages.
- **Staff, at 390 px:**
  - the camera, the result and the manual field fit without scrolling at 390×844;
  - every button is at least 44 px;
  - the scanner stops when leaving the section (no camera left on, no battery drain).
- **Test on real phones before the event:** an iPhone (Safari) and an Android (Chrome). Staff phones over 4G at the park.

## Edge deploys (Iván)

- `supabase functions deploy admin-pin registration-pass`
- `supabase functions delete admin-checkin`, if it was deployed.

## Out of scope

- Apple and Google Wallet (spec 4).
- Emailing the pass.
- Offline check-in.
- Check-out.
