# Map, calendar and Wallet button — spec

Date: 2026-10-06 · Branch: `feat/event-logistics` · Status: **approved** (Iván, 2026-10-06), with "Agregar a mi agenda" on the home page only

## Problem

Iván, 2026-10-06, four changes in one branch:
1. a Google map with the address;
2. no Wallet on iOS or Safari;
3. "Agregar a mi agenda";
4. the official Google Wallet icon.

Today:
- `eventConfig.location` says "Punto de encuentro por confirmar". There is no address and no map anywhere: home, `/registro`, `/pase` and the email all lack them.
- `isAppleMobile` (`features/registration/wallet.ts`) hides the Google Wallet button only on iPhone and iPad. Safari on a Mac, and an iPad in desktop mode, still see it, and Google Wallet does not work there.
- No way to save the event to a calendar.
- The button uses Lucide's generic `Wallet` icon and the copy "Añadir a Google Wallet". Google's brand guidelines ask issuers to use the official "Add to Google Wallet" button.

## Decisions

1. **Meeting point in `features/event/event.ts`:**
   - `location`: the place name (e.g. "Parque del Ingenio");
   - `address`: a text Google Maps can find (e.g. "Parque del Ingenio, Cali, Valle del Cauca").
   - A pure `features/event/maps.ts` builds two URLs from `address`:
     - `mapsUrl`: `https://www.google.com/maps/search/?api=1&query=…`, the official universal link. On a phone it opens the Google Maps app;
     - `mapsEmbedUrl`: `https://www.google.com/maps?q=…&output=embed`.
2. **The map on the home page,** in the final section ("05 / NOS VEMOS"), under the date:
   - "Punto de encuentro", followed by the address;
   - an `<iframe>` with `loading="lazy"` and a `title`;
   - "Abrir en Google Maps" (`ArrowUpRight`, a new tab).
   - On `/registro` and `/pase`, the "Punto" fact becomes a link to `mapsUrl`, with no iframe. On a phone the form matters more there.
3. **Wallet only off Apple browsers.** `isAppleMobile` becomes `isApplePlatform(userAgent)`. It is true for:
   - iPhone, iPad and iPod;
   - Safari on macOS: `Safari` in the user agent with none of `Chrome`, `Chromium`, `CriOS`, `FxiOS`, `Edg`, `OPR` or `Android`. This also covers an iPad in desktop mode.
   - Chrome, Edge and Firefox on a Mac still see Wallet.
   - Detection stays on the server, using the `user-agent` header, as today, so there is no flash on load.
4. **"Agregar a mi agenda",** one button with a `CalendarPlus` icon (added to the vocabulary). Its link depends on `isApplePlatform`:
   - **Apple:** `/evento.ics`, a Next route (`app/evento.ics/route.ts`) that answers `text/calendar`. iOS and macOS open the "add event" sheet;
   - **everything else:** a Google Calendar template link (`calendar.google.com/calendar/render?action=TEMPLATE…`), which opens the app on Android.
   - **Both carry:**
     - the title "NeoTeam Social Run";
     - the start and end times from `startsAt` and `endsAt`;
     - the address;
     - a short description with a link to the site.
   - **The `.ics` file:**
     - it has a fixed `UID`;
     - it has a reminder (`VALARM`) one day before;
     - its lines end in CRLF;
     - text is escaped per RFC 5545.
   - A pure `features/event/calendar.ts` holds `googleCalendarUrl()` and `eventIcs()`.
   - **Where:** only on the home page, in the final section next to "Quiero estar ahí" (Iván, 2026-10-06: not on the pass card).
   - Every device gets one of the two links: Apple devices get `.ics`; Android, Windows and Linux get Google Calendar. So no device is left without the button.
5. **The official Google Wallet button:**
   - The Spanish (es-419) "Agregar a Google Wallet" SVG from Google's Wallet brand guidelines, unchanged, saved as `features/registration/google-wallet-button.svg`.
   - Rendered with a static import, so it needs no new `public/` folder.
   - At least 48 px tall.
   - Its `alt` text is "Agregar a Google Wallet".
   - It replaces today's black button with the `Wallet` icon. `Wallet` leaves the icon vocabulary.

## Alternatives rejected

- **Maps Embed API with a key:** it is the official embed, but it needs a new `NEXT_PUBLIC_*` key restricted by domain, plus a Google Cloud setup. `output=embed` needs no key. If Google ever breaks it, only the iframe fails and the "Abrir en Google Maps" link keeps working.
- **A static map image:** it needs the Static Maps API key, and it is not interactive.
- **Showing both calendar links:** two buttons where one chosen by device is enough.
- **Detecting Safari in the browser:** it would flash, and it does not match how Wallet already works.
- **Keeping Lucide `Wallet`:** Google's guidelines require their button for "Add to Google Wallet".

## Design constraints

- **DESIGN.md, rule 6 (Lucide only, no inline SVG):** add an exception for **official third-party badges**, which are kept as files and never redrawn. The only one today is Google Wallet's.
- **Icon vocabulary:**
  - add `CalendarPlus` ("Agregar a mi agenda");
  - remove `Wallet`;
  - `MapPin` already means "place".
- Map and calendar styles go in `app/home-v2.css` for the home page, and in Tailwind for the pass card and `/registro`.

## Mobile

- **Designed at 390 px first:**
  - the map is full width and 240 px tall, rising to 320 px at `md:`;
  - the calendar and Maps buttons are at least 44 px tall and full width on a phone.
- **Cost on 4G:**
  - the iframe uses `loading="lazy"` and sits at the bottom of the home page, so Maps loads only when the user scrolls there. Google's iframe is heavy, about 1 MB or more;
  - the Wallet SVG is a few KB;
  - `.ics` is generated on request (about 1 KB).
- **On an iPhone:**
  - the Google Wallet button no longer appears;
  - "Agregar a mi agenda" on the home page opens the native Calendar sheet.

## Security

- No new env variables, no new dependencies, no edge function changes and no migrations. Only Vercel deploys.
- The iframe is third-party content with no access to the page: it runs inside Google's own origin.
- `/evento.ics` is public, static content with no runner data.

## Out of scope

- The map or the calendar link inside the pass email (that needs an edge function deploy; it can come later).
- Apple Wallet (`.pkpass`).
- "Agregar a mi agenda" on the pass card (`/registro`, `/pase`).
- A route map, such as a drawn path or GPX.

## Needed from Iván before implementing

- **The exact meeting point:** the place name and an address or pin that Google Maps finds. For example: "Parque del Ingenio, entrada por la Cra. 85, Cali".
