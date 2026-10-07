# Fast home, scan feedback and repeated check-in — plan

Spec: `docs/superpowers/specs/2026-10-07-fast-home-scan-feedback-design.md` · Branch: `feat/fast-home-scan-feedback`

## Tasks (one commit each)

1. **`perf(home): serve the home page from the cache`**
   - `app/page.tsx`: `revalidate = 60` replaces `force-dynamic`.
   - `vercel.json`: `"regions": ["gru1"]`.
   - Check:
     - `pnpm build` lists `/` as ISR (`○`/`●` with revalidate 60);
     - the local throttled measurement (`perf.cjs`, 390 px, CPU 4×, Slow 4G) against `pnpm start`, before and after;
     - screenshots of the hero, numbers and marquees, unchanged.
2. **`perf(home): optimized logo images`**
   - New file `next.config.ts` with `images.remotePatterns`, limited to the project's public Storage path.
   - `features/home/logo-marquee.tsx` and `features/home/community-carousel.tsx`: drop `unoptimized`, add `sizes`.
   - Check:
     - image bytes at 390 px before and after;
     - logos still sharp at 3× DPR;
     - a non-Storage URL is refused by the optimizer.
3. **`feat(admin): vibration and sound on every scan`**
   - New file `features/admin/ui/scan-feedback.ts`: the patterns, the Web Audio tones and the unlock on first tap.
   - `scan-station.tsx` calls it for every outcome.
   - Check: Playwright at 390 px, with `navigator.vibrate` and `AudioContext` stubbed. Success, repeat and error each call the right pattern and tone.
4. **`feat(admin): repeated check-in is impossible to miss`**
   - `scan-station.tsx`: new `warning` tone (amber, `Clock`).
   - `checkin-view.tsx` and `participation-panel.tsx` use it for "Ya hizo check-in" and "Ya participó" / "Ya había ganado".
   - `qr-scanner.tsx`: `REPEAT_WINDOW_MS` 5000 → 1500.
   - Check: Playwright at 390 px in light and dark, with a mocked `/api/admin`. The first scan shows "Check-in listo"; scanning again after 1.5 s shows the amber "YA HIZO CHECK-IN · a las …".
5. **`docs: scan feedback and cached home`**
   - DESIGN.md: the feedback table and the warning tone.
   - CLAUDE.md: the home page is ISR (60 s), not `force-dynamic`, and the region.
6. **`chore(release): 0.19.0`**: CHANGELOG and `package.json`.
   - Check: `pnpm ci:check` exit 0.

## Rollout

Merge, and Vercel deploys. No Supabase change.

**After the deploy:**
- measure production again with the same script;
- test the sound and vibration on a real Android phone and an iPhone at the check-in screen.
