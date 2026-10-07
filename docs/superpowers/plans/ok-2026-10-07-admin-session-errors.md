# Keep the admin session through upstream errors, and the logo strip moving — plan

Spec: `docs/superpowers/specs/2026-10-07-admin-session-errors-design.md` · Branch: `fix/admin-session-errors`

## Tasks (one commit each)

1. **`fix(admin): an upstream error no longer signs staff out`**
   - `supabase/functions/_shared/session.ts`: throw on a query error, and leave the `last_seen_at` update best effort.
   - Check:
     - read every caller of `requireSession` (`admin-pin`, `admin-logos`) and confirm a throw becomes a 500, never a `valid: false`;
     - Playwright at 390 px with `/api/admin` answering 502 for `validate`: the panel shows the retry message, and the cookie is not expired (no `Set-Cookie: Max-Age=0`);
     - with `valid: false`, it still shows the sign-in screen.
2. **`fix(home): the logo strip resumes after a card is clicked`**
   - **Cause:** `features/home/logo-marquee.tsx` pauses the strip with `group-focus-within`. A mouse click or a tap leaves the focus on the card's link, so the strip stays stopped after coming back from the opened tab.
   - **Fix:** pause only on keyboard focus (`group-has-[:focus-visible]`) and keep the hover pause.
   - Check:
     - Playwright at 390 px and 1440: click a card, return to the page, and confirm the animation is `running`;
     - Tab to a card and confirm it is `paused`.
3. **`chore(release): x.y.z`** (patch): CHANGELOG `Fixed` and `package.json`.
   - Check: `pnpm ci:check` exit 0.

## Rollout

Deploy the functions:
- `supabase functions deploy admin-pin --project-ref ohatsnkgaeccltqwhkbv`;
- the same for `admin-logos`.

No web change and no migration.
