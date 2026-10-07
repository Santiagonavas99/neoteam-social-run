# The pass as a race bib — spec

Date: 2026-10-07 · Branch: `feat/pass-design` · Status: **approved** (Iván, 2026-10-07)

## Problem

Santiago, via Iván (2026-10-06): "que el pase quede realmente bonito y útil para el evento". He asks for:
- the runner's name, number or code, "NeoTeam Anniversary", the date, the place and the current branding;
- a large QR, so that at the entrance it is "sacar el celular → escanear → listo".

He also asks for an alternative for iPhone, where Google Wallet does not work.

The pass exists in three places today, and none of them looks like the event:

| Where | Today |
|---|---|
| Screen (`PassCard`, after registering and on `/pase`) | A white card: a 260 px QR, the name and the code. No date, no place, no logo. |
| Email (`_shared/pass-email.ts`) | A plain header "NEOTEAM · SOCIAL RUN", the QR, the code, the date and the route. No place. |
| Google Wallet (`walletObject`) | Name, code, QR, route and time. **No place.** The logo and the event name live in the class, which Santiago manages in the Google Pay & Wallet Console. |

On iPhone, the only options are a screenshot or the email.

## Decisions

1. **The pass is a race bib ("dorsal").**
   - A bib is the one object every runner recognises, so the pass takes that shape instead of a generic ticket.
   - It is always black (`--neo-black`), like the hero and the header, in both themes.
   - Four small pin holes, one in each corner (CSS circles), make it read as a bib.
   - **Top:** `NeoTeamLogo` and the line "ANIVERSARIO NEOTEAM · SOCIAL RUN".
   - **The code `SR26-00042`** is the bib number, as large as the width allows (Host Grotesk 800, tight tracking).
   - **The runner's name** goes under it.
   - **The QR** sits on a white panel with its quiet zone. It is as wide as the bib allows: at least 280 px at 390 px, and never above 320 px. It stays black on white whatever the theme, because scanners need that contrast.
   - **A perforated line** (a dashed border with two half-circle notches) separates the QR from the facts.
   - **Facts row:** Fecha "18 OCT 2026" (`CalendarDays`), Llegada "7:30 a. m." (`Clock`) and Lugar "Parque del Ingenio, Cali" (`MapPin`), in `--neo-on-dark-secondary` on black.
   - **Under the bib,** outside the black surface: the Wallet button on Android and desktop, or the image button on Apple (decision 4); the screenshot hint stays.
2. **The email uses the same bib,** with the same order: logo line, code large, name, QR, perforation and facts.
   - It is built with tables and inline styles, so Gmail and Outlook render it.
   - Two links:
     - "Ver mi pase" (`/pase`);
     - "Cómo llegar" (Google Maps).
   - "Lugar" is added to the text version.
   - The logo travels as a second inline image (`cid:pass-logo`, a PNG rendered once and committed). Email clients block SVG, so the plain-text header is replaced by the logo.
3. **Google Wallet object:**
   - a "LUGAR" text module with `eventConfig.location`;
   - the "ENCUENTRO" module stays.
   - **Not in code: a checklist for Santiago in the console.** On the class he sets the logo, the hero image, the venue name and address, the event date, and the color `#050505`. The code cannot change the class without new permissions, and the class is already approved.
4. **iPhone alternative: "Guardar pase en Fotos".**
   - The route `GET /api/pass-image?token=<checkinToken>` returns a 1080 × 1920 PNG of the same bib, built with `next/og` `ImageResponse`. It ships with Next, so no new dependency.
   - **When it shows:** on screen, in place of the Wallet button, only when `isApplePlatform`. It uses the `ImageDown` icon.
   - Tapping it opens the image; a long press saves it to Photos, which is how iPhone users keep tickets that are not in Wallet.
   - **Lookup:** the same as `/api/wallet/google`. The token goes through `passByToken`; a missing or cancelled pass gets a 404, and the response is `Cache-Control: private, no-store`.
   - **Rejected:** Apple Wallet (`.pkpass`), which needs an Apple Developer account at 99 USD a year plus signing certificates; and a PWA, which adds a service worker for something an image already covers.
5. **One source for the pass content.**
   - The facts (date, arrival and place) come from `eventConfig` and `agenda[0]` in a new pure `features/event/pass-facts.ts`, used by the screen, the image and Wallet.
   - The email keeps its own copy, because Deno cannot import it, with the existing "keep in sync" comment, now including the place.

## Alternatives rejected

- **A generic ticket stub:** it is the template answer. A bib is specific to a race.
- **The white card, only with more fields:** it would still look like a form result, not like something to show at the gate.
- **A QR of 360 px or more:** at 390 px the bib's padding leaves about 320 px. The scanner reads 280 px from a screen comfortably.
- **A hosted image in the email** (`/api/pass-image` as `<img src>`): the token would travel in an image URL that mail proxies fetch and cache. The email keeps the inline attachment.

## Design constraints

- **DESIGN.md:**
  - `--neo-black` is the "always dark" surface, and the bib is one;
  - accent text on black uses `--neo-accent`, the same exception as the countdown, so DESIGN.md's rule gains "and the bib";
  - text is at least 12 px;
  - icons: `ImageDown` is added to the vocabulary ("save the pass as an image").
- **The QR keeps the error correction level `M`** and the `NEOTEAM-SR26:` prefix, so the scanner does not change.
- **Tailwind on `--neo-*` tokens,** next to the component. No new global CSS.

## Mobile

- **Designed at 390 px first:**
  - the bib is full width minus the 20 px page gutter;
  - the QR is at least 280 px;
  - the code fills the width at about 44 px;
  - the facts sit in a 3-column row that wraps to stacked rows below 360 px.
- **At the gate:**
  - nothing above the QR on the bib forces a scroll: the pass card scrolls into view when it appears (already true after registering);
  - the QR is the brightest element.
- **Image:** 1080 × 1920 (9:16), which fills an iPhone screen in Photos.
- **Cost:**
  - the bib is CSS plus the existing SVG QR;
  - the image is only generated when tapped;
  - the email gains about 6 KB for the logo PNG.

## Security

- `/api/pass-image` exposes nothing beyond what `/api/wallet/google?token=` already exposes for the same token: name, code and QR.
- It answers 404 for unknown or cancelled tokens, and it is `no-store`.
- No new env vars and no migrations. The email change needs `supabase functions deploy registration-pass admin-pin`.

## Out of scope

- Apple Wallet (`.pkpass`) and a PWA.
- Changing the Google Wallet class from code.
- Staff-side changes to the scanner.
