# Streamers on registration — plan

Spec: `docs/superpowers/specs/2026-10-07-registration-streamers-design.md` · Branch: `feat/registration-streamers`

## Tasks (one commit each)

1. **`feat(registration): streamers when a runner registers`**
   - `features/registration/streamers.tsx`: the overlay, with about 28 ribbons styled from their index. It unmounts after the animation.
   - `app/tailwind.css`: the `streamer-fall` keyframe.
   - `registration-form.tsx`: render `<Streamers />` in the success branch.
   - `DESIGN.md`, rule 4: name the streamers as the one celebratory motion.
   - Check:
     - Playwright at 390 px in light and dark: register (mocked), screenshot during the burst, and confirm the layer is gone after 3 s;
     - `prefers-reduced-motion`: no layer at all;
     - the buttons stay clickable during the burst;
     - `scrollWidth` is 390;
     - then the same at 1440.
2. **`chore(release): 0.16.0`**: CHANGELOG `Added` entry and `package.json`.
   - Check: `pnpm ci:check` exit 0.

No Supabase change.
