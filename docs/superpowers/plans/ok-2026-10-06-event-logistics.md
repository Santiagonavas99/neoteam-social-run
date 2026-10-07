# Map, calendar and Wallet button — plan

Spec: [`2026-10-06-event-logistics-design.md`](../specs/2026-10-06-event-logistics-design.md)

- **Branch:** `feat/event-logistics`, cut from `main` (0.10.0).
- **Release:** `0.11.0` (task 5).
- **Deploy:** Vercel only. No migration, no secrets, no edge functions.

Status: **approved** (Iván, 2026-10-06), with "Agregar a mi agenda" on the home page only. Task 3 waits for the meeting-point address.

## 1. `fix(pass): hide Google Wallet on iOS and Safari`

- **`features/event/platform.ts`** (new, in the shared kernel, because task 4 needs it too): `isApplePlatform`, covering iPhone, iPad and iPod, plus Safari without Chrome, Chromium, CriOS, FxiOS, Edg, OPR or Android. It replaces `isAppleMobile` in `features/registration/wallet.ts`.
- **`features/event/platform.test.ts`** (the Apple cases move here from `wallet.test.ts`):
  - true for iPhone, iPad, Mac Safari and iPad in desktop mode;
  - false for Mac Chrome, Mac Firefox, Mac Edge, Android Chrome, Windows and an empty string.
- **`features/registration/pass.ts`:** use the new name.
- **Checks:**
  - `pnpm test`;
  - with an emulated user agent, iPhone and Mac Safari do not show the button, and Mac Chrome and Android do.

## 2. `feat(pass): official Google Wallet button`

- **`features/registration/google-wallet-button.svg`:** Google's es-419 "Agregar a Google Wallet" asset, unchanged. The commit message names its source URL.
- **`features/registration/pass-card.tsx`:** a static import rendered with `next/image` and `unoptimized`. The link gets a 48 px height, a visible `focus-visible` style and the `alt` "Agregar a la Billetera de Google" (the text of the official es-419 badge). The `Wallet` import goes.
- **`DESIGN.md`:**
  - an exception in rule 6 for official third-party badges;
  - vocabulary: `Wallet` removed.
- **Checks:**
  - 390 px, then 1440;
  - light and dark;
  - keyboard focus is visible;
  - the link still redirects to Google's save page.

## 3. `feat(event): meeting point with Google Maps`

- **`features/event/event.ts`:** `location` (the place name) and `address`.
- **`features/event/maps.ts` + `maps.test.ts`:** `mapsUrl(address)` and `mapsEmbedUrl(address)`, which encode the query.
- **`features/home/sections/final.tsx` + `app/home-v2.css`:** a "Punto de encuentro" block containing:
  - the address;
  - an `<iframe loading="lazy" title="Mapa del punto de encuentro">`, 240 px tall and 320 px at `md:`;
  - "Abrir en Google Maps" (`ArrowUpRight`, `target="_blank" rel="noopener"`).
- **`features/registration/registration-shell.tsx`:** the "Punto" fact accepts an optional `href`; on `/registro` and `/pase` it links to `mapsUrl`.
- **Checks:**
  - 390 px first, then 1024 and 1440;
  - the iframe does not load until scrolling (Network tab);
  - on a phone, the link opens Google Maps;
  - `pnpm ci:check`.

## 4. `feat(event): add to my calendar`

- **`features/event/calendar.ts` + `calendar.test.ts`:**
  - `googleCalendarUrl()`: UTC dates (`20261018T123000Z/20261018T160000Z`), title, details and location;
  - `eventIcs()`:
    - `VCALENDAR` / `VEVENT` with `UID`, `DTSTAMP`, `DTSTART`, `DTEND`, `SUMMARY`, `LOCATION`, `DESCRIPTION` and `URL`;
    - a `VALARM` with `-P1D`;
    - CRLF line endings;
    - escaping of `,` `;` `\` and newlines.
  - The test checks the dates, the escaping and the CRLF endings.
- **`app/evento.ics/route.ts`:** `GET` returns `eventIcs()` with `Content-Type: text/calendar; charset=utf-8` and `Content-Disposition: inline; filename="neoteam-social-run.ics"`.
- **`features/home/add-to-calendar.tsx`:** a server component. It reads `user-agent` and links to `/evento.ics` when `isApplePlatform`, otherwise to `googleCalendarUrl()` in a new tab. It shows the `CalendarPlus` icon and "Agregar a mi agenda".
  - `isApplePlatform` moves to `features/event/platform.ts`, so `registration` and `home` can both import it without one feature importing another.
  - Task 1 creates it there directly, and `wallet.ts` re-uses it.
- **Where:** only `final.tsx`, next to "Quiero estar ahí". It is not on the pass card.
- **`DESIGN.md`:** `CalendarPlus` added to the vocabulary.
- **Checks:**
  - 390 px first;
  - in Safari or on an iPhone, the button opens the Calendar sheet with the right date, time and place;
  - on Android or in Chrome, it opens Google Calendar with the event filled in;
  - `pnpm ci:check`.

## 5. `chore(release): 0.11.0`

- `package.json` goes to 0.11.0.
- The CHANGELOG section `[0.11.0] - <date>`:
  - **Added:** the meeting-point map, "Agregar a mi agenda" and the official Google Wallet button;
  - **Changed:** Google Wallet is hidden on iPhone, iPad and Safari.
- `CLAUDE.md`: one line on `/evento.ics`.
