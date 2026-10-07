# Fast home, scan feedback and repeated check-in — spec

Date: 2026-10-07 · Branch: `feat/fast-home-scan-feedback` · Status: **approved** (Iván, 2026-10-07: "dale caña")

## Problem

Iván, 2026-10-07:
1. "el performance de la página de inicio quiero que sea súper óptimo al abrir, sin sacrificar efecto y diseño";
2. "cuando escaneo un QR quiero que el dispositivo vibre si es celular y produzca un sonido de check";
3. "no check-in dos veces la misma persona; dar mensaje de que ya hizo check-in".

### 1. Home: measured on production (2026-10-07)

**Setup:** Playwright, 390 px, a Pixel-class user agent, CPU 4× slower, Slow 4G (150 ms RTT, 1.6 Mbps), no cache, three runs.

| Metric | Home | Note |
|---|---|---|
| TTFB | **1.2–3.0 s** | `/registro`: 0.45–0.9 s from the same place |
| FCP = LCP (hero text) | **2.3–4.0 s** | LCP waits for the HTML; nothing else blocks it |
| HTML fully streamed (curl) | 4.1–7.7 s | one request hung 30 s with no byte |
| JavaScript | 78–170 KB | fine |
| TBT | ~25 ms | fine |
| CLS | 0 | fine |
| Images | 194–399 KB | the original JPG/PNG logos from Supabase Storage (`unoptimized`), up to 77 KB each for a 200 × 112 box |

**Cause:**
- **No cache.** `app/page.tsx` is `force-dynamic`. Every visit waits for 4 Supabase queries before sending the first byte: logos, running groups, brands and the counter. The logo query can run twice when its fallback kicks in.
- **Distance.** The queries go from Vercel `iad1` (Washington) to Supabase `sa-east-1` (São Paulo), so each one crosses the continent.

The design itself (animations, CSS, fonts, JS) is not what is slow.

### 2. Scan feedback today

`ScanStation` (`features/admin/ui/scan-station.tsx`) is shared by Check-in and the dynamics stands.
- It vibrates 80 ms on success only.
- There is no sound.

### 3. Repeated check-in today

**The server already refuses it.** `checkInParticipant` only updates rows that are `registered` or `no_show`, and it answers `alreadyCheckedIn` with the time. The screen shows "Ya hizo check-in a las 7:42 a. m.".

**But the screen hides it:**
- **The message looks like a normal result.** It shows in the grey neutral tone, with the same weight as any other result.
- **A quick second scan shows nothing new.** `QrScanner` silently ignores the same QR for 5 s (`REPEAT_WINDOW_MS`). The previous "Check-in listo" stays on screen, so it looks as if the same person checked in twice.

## Decisions

### 1. Home: cache the page, same design

1. **Incremental regeneration instead of `force-dynamic`:** `export const revalidate = 60` in `app/page.tsx`.
   - Vercel serves the HTML from its CDN, close to the visitor, and rebuilds it in the background at most once a minute.
   - The counter, the logos and the community data can be up to 60 s old. That is invisible for a public landing.
   - Nothing on the home page reads cookies or headers (checked), so it can be cached as is.
2. **Functions next to the database:** `"regions": ["gru1"]` (São Paulo) in `vercel.json`.
   - The background rebuild, the registration server action and `/api/admin` all talk to Supabase in `sa-east-1`. They stop crossing the continent.
   - For Colombia, São Paulo and Washington are a similar distance.
3. **Optimized logos:**
   - drop `unoptimized` in `logo-marquee.tsx` and `community-carousel.tsx`, with a small `sizes`;
   - add a new `next.config.ts` with `images.remotePatterns` limited to `ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/**`, so Vercel serves resized WebP/AVIF;
   - the images stay `lazy`, as they are today.
4. **Effects untouched:** hero load animation, count-up, scroll reveals, marquees and the theme. The checks compare before and after.

**Goal on the same throttled phone:**
- TTFB under 400 ms;
- LCP under 1.5 s;
- CLS stays 0;
- logo bytes cut by at least half.

### 2. Vibration and a "check" sound on every scan result

A new `features/admin/ui/scan-feedback.ts` maps each result to a vibration pattern (`navigator.vibrate`) and a short tone made with Web Audio. No audio file and no dependency.

| Result | Vibration | Sound |
|---|---|---|
| Success (check-in, participation) | 80 ms | "check": two quick rising notes (about 880 → 1320 Hz, 70 ms each) |
| Already done (check-in or dynamic) | 60-80-60 ms | two equal low beeps (about 440 Hz) |
| Error (not found, cancelled, network) | 250 ms | one low buzz (about 220 Hz, 250 ms) |

- **Unlocking audio:** browsers need a tap before playing sound, iPhone above all. The first tap anywhere on the scan station unlocks it. In practice staff always tap: Check-in in the menu, "Registrar participación", or the camera permission.
- **Volume:** moderate, with short fades so it does not click.
- **iPhone:** Safari has no vibration API, so iPhones get sound only. With the silent switch on, iOS mutes web sound too. The screen result still shows.

### 3. "Ya hizo check-in" impossible to miss

- **A new `warning` tone** in `ScanOutcome`, using the existing `--neo-warning` / `--neo-warning-bg` tokens (amber), with the `Clock` icon (time) and a heading in capitals:
  - "YA HIZO CHECK-IN";
  - then "a las 7:42 a. m.";
  - then the name and code.
- **Used for** the repeated check-in and for "Ya participó en esta dinámica" / "Ya había ganado".
- **Each one gets** the "already done" sound and vibration.
- **Repeat window cut from 5 s to 1.5 s.** That is enough to ignore the same QR the camera reads several times a second. A deliberate second scan now reaches the server and shows the amber message.

## Alternatives rejected

- **A client-side fetch for the counter and logos, with a static shell:** more JavaScript and a visible pop-in. The cached HTML already contains them.
- **`revalidateTag` from the admin when logos change:** the admin saves through Supabase edge functions, not Next, so it needs a new webhook. 60 s of delay is acceptable.
- **An audio file (mp3):** an extra download and harder to tune. Web Audio needs about 20 lines.
- **Blocking the second check-in in the UI only:** the server already enforces it atomically. The fix is to make it visible.

## Design constraints

- **Tokens only:** amber is `--neo-warning` / `--neo-warning-bg`, already defined in both themes.
- **No new icon.**
- **Status never by color alone:** the amber card has its own heading and icon.
- **DESIGN.md** gets the scan feedback table and the warning tone.

## Mobile

- **Performance is measured with a mid-range phone on 4G:** 390 px, CPU 4×, Slow 4G, before and after.
- **The scan station stays the same size at 390 px.** The amber card has the same layout as the others, so nothing jumps.
- **Sound and vibration are checked on a real Android phone and an iPhone.** Playwright can only check that the calls happen.

## Security

- `remotePatterns` allows only this project's public Storage bucket path. Nothing else can use the image optimizer as a proxy.
- The region change does not change any secret or key.

## Out of scope

- Moving Supabase to another region.
- Rebuilding the page from the admin on save.
- A setting to mute the scan sound (add it if staff ask on event day).
