# Home refresh — plan

Spec: [`2026-10-06-home-refresh-design.md`](../specs/2026-10-06-home-refresh-design.md) · Branch: `feat/home-refresh` (spec, plan, Task 1: merged as PR #25), then `feat/home-theme-motion` (Tasks 2–9) · Status: **approved** (Iván, 2026-10-06) · Freeze: 15 Oct.

## Tasks

### 1. `fix(home): community data permissions` (needs Iván first)

1. **Iván runs the read-only check** on the remote:

   ```sql
   select table_name, grantee, privilege_type
   from information_schema.role_table_grants
   where table_name in ('running_groups','brands') and grantee in ('anon','authenticated');

   select tablename, policyname, roles, cmd, qual
   from pg_policies where tablename in ('running_groups','brands');
   ```

2. **`supabase/migrations/<ts>_home_community_read.sql`:** `grant select` to `anon` on the two tables, plus a policy `for select using (active and show_on_home)`, idempotent (`drop policy if exists`).
3. **`features/home/data.ts`:** log `error.message`.
4. **Check:**
   - Iván runs the migration in a rollback transaction first, then for real;
   - the home shows the community section locally.

### 2. `feat(ui): one theme for the whole site`

- **`lib/theme.ts`:** the key becomes `neoteam_theme`, with the old admin key read as a fallback; the script targets `document.documentElement`; tests updated.
- **`app/layout.tsx`:** `<html data-theme="light" suppressHydrationWarning>` and the pre-paint script in `<head>`.
- **`app/admin/layout.tsx`:** keeps its wrapper for bg and text color, but loses its own script and `data-theme`.
- **`features/admin/shell/theme-switch.tsx`:** `useThemeChoice` writes to `<html>`.
- **`components/theme-menu.tsx`:**
  - a 44 px icon button with `popovertarget`;
  - a `popover` menu with Claro / Oscuro / Sistema, using `aria-pressed`;
  - it reuses `useThemeChoice`.
- **`components/site-header.tsx`:** the button sits before "Registrarme".
- **Checks:**
  - 390 px, then 1440;
  - Escape closes the menu and focus returns to the button;
  - the choice persists across `/`, `/registro`, `/pase` and `/admin`;
  - no flash on reload.

### 3. `refactor(home): palette tokens in home-v2.css and public surfaces`

- **`app/home-v2.css`:** the 31 colors go to tokens (mapping table in the commit body).
- **`app/globals.css` and `app/home-v2.css`:** every page surface painted with `--neo-white`/`--neo-black` goes to `--neo-surface`/`--neo-bg`/`--neo-text`, except the always-dark hero, header and footer band.
- **Checks:**
  - `rg` finds no hex in `home-v2.css`;
  - the contrast audit script (the admin one, pointed at `/`, `/registro` and `/pase`) reports nothing under 4.5:1, in light and in dark, at 390 px.

### 4. `feat(home): logo strip tiles` (spec decision 3)

- **`features/home/logo-marquee.tsx`:** rebuilt in Tailwind:
  - label row;
  - tiles;
  - mask fade;
  - pause on hover;
  - grayscale-to-color on hover and focus;
  - the reduced-motion fallback.
- **`app/logo-marquee.css`:** keeps only the `@keyframes` (or moves into `tailwind.css` as `--animate-marquee`); the rest is deleted.
- **Checks:**
  - the tiles measure 148×88 at 390 px and 200×112 at 1440;
  - linked logos are reachable with Tab and keep their visible focus;
  - with reduced motion the strip does not move and scrolls by hand.

### 5. `feat(home): agenda timeline` (spec decision 4)

- **`features/home/sections/agenda.tsx`:** an `<ol>` timeline in Tailwind, with a sticky heading from `lg`.
- **`features/event/event.ts`:** two agenda items gain `highlight: true`. No `summary` field: the existing details render as one paragraph instead.
- The agenda rules are deleted from `home-v2.css`.
- **Checks:**
  - the section is at most 1,000 px tall at 390 (result: 1,129 px, down from 2,516; going lower would mean cutting event copy);
  - at 1440 there is no empty column;
  - the highlighted items show the cyan dot.

### 6. `feat(home): scroll reveal` (spec decision 5)

- **`app/tailwind.css`:** `@utility reveal` with the keyframes, guarded by `@supports` and reduced motion.
- `reveal` goes on the section heads, the timeline items and the tiles.
- **Checks:**
  - in Chrome, elements fade in when scrolled into view;
  - with reduced motion emulated, there is no animation;
  - the first screen is complete without scrolling.

### 7. `feat(home): sections and footer` (spec decision 6)

- "El plan" facts as a row with icons on phones.
- The Rifas right panel goes to brand black.
- Footer links to Registro, Mi pase and Agenda, with 44 px targets.
- **Check:** 390 px, then 1440.

### 8. `docs(design): public theme and motion`

- **`DESIGN.md`:**
  - the theme now covers the public pages;
  - the `reveal` utility and its rules;
  - Known debt updated.

### 9. `chore(release): 0.9.0`

PR #25 merged the spec, the plan and Task 1 into `main` together with the admin's 0.8.0 release commit, so v0.8.0 is out. Tasks 2–9 continue on `feat/home-theme-motion`.
- `package.json` goes to 0.9.0.
- The CHANGELOG gains the dated section:
  - **Added:** the theme on the home and the scroll motion;
  - **Changed:** the logo strip, the agenda and the footer;
  - **Fixed:** the community section, released by PR #25 but not in its notes.

## Done when

- `pnpm ci:check` passes after every task.
- 390 px first, then 1440, in light and in dark, for every task.
- The branch stays local until Iván says to push it.
