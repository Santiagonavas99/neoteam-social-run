# The pass as a race bib — plan

Spec: [`2026-10-07-pass-design-design.md`](../specs/2026-10-07-pass-design-design.md)

- **Branch:** `feat/pass-design`, cut from `main` (0.11.0).
- **Release:** `0.12.0` (task 5).
- **Deploy:**
  1. Vercel (the web);
  2. Iván runs `supabase functions deploy registration-pass admin-pin --project-ref ohatsnkgaeccltqwhkbv`, because the email changes;
  3. Santiago updates the Wallet class in the console (task 4 checklist).

Status: **approved** (Iván, 2026-10-07).

## 1. `feat(event): pass facts`

- **`features/event/pass-facts.ts` + test:** `passFacts()` returns `[{ label: 'Fecha', value: '18 OCT 2026' }, { label: 'Llegada', value: '7:30 a. m.' }, { label: 'Lugar', value: 'Parque del Ingenio, Cali' }]`, built from `eventConfig` and `agenda[0]`.
- **`features/registration/google-wallet.ts`:** the text modules come from `passFacts()`, which adds "LUGAR". `google-wallet.test.ts` is updated.
- **Check:** `pnpm test`.

## 2. `feat(pass): race bib on screen`

- **`features/registration/pass-card.tsx`:** the bib from spec decision 1, in Tailwind on the tokens:
  - `NeoTeamLogo`;
  - the code, large;
  - the name;
  - the QR on white, `min(100%, 320px)` and at least 280 px at 390 px;
  - the perforation;
  - the facts row with `CalendarDays`, `Clock` and `MapPin`.
  - The Wallet badge and the hint go under the bib.
- **`DESIGN.md`:** the accent-on-black exception adds "and the pass bib".
- **Checks:**
  - 390 px first, then 1440;
  - light and dark: the bib stays black;
  - 360 px wraps the facts;
  - the QR measures at least 280 px;
  - a phone scan with the admin Check-in works, against a local mock or the preview.

## 3. `feat(pass): save the pass as an image on iPhone`

- **`app/api/pass-image/route.ts`:**
  - `GET ?token=`;
  - `passByToken`, then 404 if missing;
  - an `ImageResponse` (from `next/og`) of 1080 × 1920 with the same layout. The QR is an `<img>` of the SVG data URL from `passQrDataUrl`, and the logo is `NeoTeamLogo`'s paths as an inline SVG data URL;
  - `Cache-Control: private, no-store`.
- **`features/registration/pass.ts`:** `Pass` gains `imageUrl?`, set only when `isApplePlatform`, while `googleWalletUrl` is set only when it is not.
- **`pass-card.tsx`:** when `imageUrl` is set, a 48 px "Guardar pase en Fotos" link (`ImageDown`) opens it in a new tab.
- **`DESIGN.md`:** `ImageDown` is added to the vocabulary.
- **Checks:**
  - with an iPhone user agent, the button shows and Wallet does not;
  - the PNG renders with a scannable QR, scanned from the image on a second screen;
  - an unknown token gets a 404;
  - `pnpm build`.

## 4. `feat(email): race bib in the pass email`

- **`supabase/functions/_shared/pass-email.ts`:**
  - the bib layout as tables with inline styles;
  - a "Lugar" line;
  - a "Cómo llegar" link to Google Maps;
  - the logo as a second inline attachment (`cid:pass-logo`);
  - the text version gains "Lugar".
- **`supabase/functions/_shared/pass-logo.ts`:** the logo PNG as a base64 constant, rendered once from `NeoTeamLogo` at 2×, white on black.
- **`docs/email-setup.md`:**
  - the deploy note for 0.12.0;
  - **a Google Wallet console checklist for Santiago:** logo, hero image, venue, date and color on the class.
- **Checks:**
  - a test send to `delivered@resend.dev` through a local render;
  - after deploy, Iván receives it in Gmail on a phone, the bib renders, and the QR scans from the email.

## 5. `chore(release): 0.12.0`

- `package.json` goes to 0.12.0.
- The CHANGELOG section `[0.12.0] - <date>`:
  - **Changed:** the pass looks like a race bib on screen and in the email, with the date, arrival time and place; Google Wallet shows the place;
  - **Added:** "Guardar pase en Fotos" on iPhone.
- `CLAUDE.md`: `/api/pass-image`.
