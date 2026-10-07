# Theme switch with an animated change — plan

Spec: `docs/superpowers/specs/2026-10-07-theme-switch-design.md` · Branch: `feat/theme-switch`

## Tasks (one commit each)

1. **`feat(header): light and dark switch instead of the theme menu`**
   - New file `components/theme-toggle.tsx`, the switch.
   - `components/use-theme-choice.ts` also returns the resolved theme.
   - `components/site-header.tsx` uses `ThemeToggle`.
   - Delete `components/theme-menu.tsx`.
   - Check: Playwright at 390 px, then 1440, 1920 and 2560, with the device in light and in dark:
     - the switch shows the device theme on the first visit;
     - a tap flips it, and the choice survives a reload;
     - Space toggles it from the keyboard;
     - `aria-checked` follows the theme;
     - no horizontal scroll;
     - the hit area is 44 px.
2. **`feat(header): animated theme change`**
   - `components/theme-toggle.tsx`: `startViewTransition` plus the circle `clip-path` from the switch center.
   - `app/tailwind.css`: the view-transition rules.
   - Check:
     - a screenshot halfway through the transition shows the circle;
     - with `prefers-reduced-motion`, no transition runs (`startViewTransition` is not called);
     - without the API (stubbed away), the theme still changes.
3. **`docs: theme switch`**: DESIGN.md (switch, motion rule 4) and CLAUDE.md, if it names the menu.
4. **`chore(release): 0.20.0`**: CHANGELOG and `package.json`.
   - Check: `pnpm ci:check` exit 0.

**After merging:** Iván checks it on Safari on the big screen where it failed. WebKit is not installed for Playwright here.
