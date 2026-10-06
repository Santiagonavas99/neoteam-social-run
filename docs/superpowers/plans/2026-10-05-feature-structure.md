# Feature structure and component split — plan

Spec: `docs/superpowers/specs/2026-10-05-feature-structure-design.md`. Branch: `refactor/feature-structure`, cut from `main` at 0.2.0. Status: **waiting for Iván's OK** (includes approval of the new top-level `features/` folder).

## Ground rules

- **Moves and extractions only.** The markup, the class names, the Spanish copy and the behavior all stay identical. Each moved file is moved with `git mv` so its history follows it.
- **Checks for every task:**
  - `pnpm ci:check` passes;
  - mocked screenshots at **390 px first**, then 1440, are compared pixel by pixel with the Task 0 baseline.
- **The screenshots cover:**
  - admin: auth screen, every section, an open editor, a confirmation panel;
  - public: home and `/registro`.
- **The only expected difference is the home marquee, which is animated.**

## Task 0 — Baseline (no commit)

- [ ] Build `main` and run `next start` on port 3100. Take mocked admin screenshots and public screenshots at 390 and 1440 into the scratchpad. Stop the server.

## Task 1 — Feature folders for event, registration and home

- [ ] Config:
  - `app/tailwind.css`: add `@source "../features";`.
  - `biome.json`: add `features/**` to `files.includes`.
- [ ] `git mv`:
  - `lib/event.ts` → `features/event/event.ts`;
  - `lib/countdown.ts` and `lib/countdown.test.ts` → `features/event/`;
  - `components/event-countdown.tsx` → `features/event/`;
  - `lib/registration-schema.ts` and its test → `features/registration/schema.ts` and `schema.test.ts`;
  - `app/registro/actions.ts` and `app/registro/registration-form.tsx` → `features/registration/`;
  - `lib/home-features.ts` → `features/home/data.ts`;
  - `components/community-carousel.tsx` and `components/logo-marquee.tsx` → `features/home/`.
- [ ] Update the imports in `app/page.tsx`, `app/registro/page.tsx` and the moved files.
- Check:
  - home and `/registro` at 390, then 1440, identical to baseline (countdown included);
  - `pnpm test` still runs 16 tests.
- Commit: `refactor: feature folders for event, registration and home`

## Task 2 — Delete dead code

- [ ] `features/home/data.ts`: remove `HomeFeatureCard`, `defaultHomeFeatureCards` and `getHomeFeatureCards`.
- [ ] `app/admin/admin-dashboard.tsx`: remove the `section === 'home'` branch, `cards`, `loadCards`, `updateCard`, `saveCards` and the `listCards` calls at bootstrap, setup and login.
- [ ] `app/admin/admin-types.ts`: remove `'home'` from `AdminSection` and `cards` from `AdminResponse`.
- [ ] `app/admin/admin-ui.tsx`: remove `home` from `sectionIcons`.
- [ ] Delete `lib/supabase/browser.ts`.
- Check:
  - `grep -rn "HomeFeatureCard\|listCards\|createBrowserSupabaseClient" app components features lib` is empty;
  - admin screenshots identical;
  - with the mocked API, login no longer requests `listCards`.
- Commit: `refactor: remove unreachable home cards editor and unused browser client`

## Task 3 — One proxy for both admin routes

- [ ] `lib/admin-proxy.ts`: add `proxyToEdgeFunction(request, functionName, connectionError, env = process.env)`. It holds the current route logic: the env checks, `adminUpstreamHeaders`, `parseAdminBody`, the upstream fetch with timeout and `redirect: 'error'`, 5xx turned into a generic error, and `Cache-Control: no-store`. The log prefix includes the function name.
- [ ] `lib/admin-proxy.test.ts`, with `fetch` stubbed. Cases:
  - missing URL or key → 503;
  - missing proxy secret → 503;
  - bad body → 400;
  - upstream 500 → 502 with the generic copy;
  - upstream 401 → passed through;
  - network failure → 502.
- [ ] `app/api/admin/route.ts` and `app/api/admin/logos/route.ts`: `runtime` plus one `POST` that calls `proxyToEdgeFunction`, each with its own Spanish copy.
- Check: new tests green; admin flows with the mocked API unchanged.
- Commit: `refactor(api): single edge-function proxy for admin routes`

## Task 4 — Home sections

- [ ] `features/home/sections/`, holding the JSX cut as is from `app/page.tsx`:
  - `hero.tsx`;
  - `story.tsx`;
  - `agenda.tsx`;
  - `community.tsx` (receives `community` and does the brand filtering);
  - `raffle.tsx`;
  - `final.tsx`.
- [ ] `app/page.tsx` keeps `dynamic`, loads the data and composes the sections, in about 25 lines.
- [ ] `components/brand-link.tsx`: the NEOTEAM `brand-mark` link. Used by `site-header.tsx` and, from Task 6, by the admin.
- Check: home at 390, then 1440, identical; countdown visible above the fold at 390×844.
- Commit: `refactor(home): one component per section`

## Task 5 — Admin foundation

- [ ] `git mv app/admin/admin-ui.tsx features/admin/ui/admin-ui.tsx`, keeping `Feedback`, `StatusBadge` and `Logo`.
- [ ] `features/admin/types.ts`:
  - `Participant`, `RunningGroup`, `Brand`, `Raffle`, `LogoItem`, `Metrics`;
  - `AdminResponse`, typed per action where it is used;
  - `FeedbackValue`.
- [ ] `features/admin/labels.ts`: `participantStates`, `raffleStates`, `brandTypes`.
- [ ] Delete `app/admin/admin-types.ts`.
- [ ] `features/admin/sections.ts`: one `adminSections` list with `id`, `label`, `description`, `icon` and an optional `quickAccess` detail. It replaces `navigation`, `sectionIcons` and the quick-access tuples.
- [ ] `features/admin/api.ts`: `callAdmin` and `callLogos` on top of one `post(endpoint, action, payload, { gzip })`, keeping the current error copy.
- [ ] `features/admin/errors.ts`: `errorMessage(error, fallback)`, plus `errors.test.ts`.
- [ ] `features/admin/ui/`:
  - `refresh-button.tsx`;
  - `loading-state.tsx`;
  - `empty-state.tsx`;
  - `record-card.tsx`;
  - `editor-form.tsx`;
  - `image-upload-field.tsx` with `readFileAsBase64`, keeping the 4 MB check and the current copy, which is passed in as props;
  - `confirm-panel.tsx`;
  - `label-options.tsx`;
  - `use-admin-list.ts`.
- [ ] Biome override `noAutofocus`: `app/admin/**` becomes `features/admin/**`.
- [ ] The current `app/admin/*` files import from the new places. No screen is split yet.
- Check: `pnpm typecheck` with the per-entity types; admin screenshots identical.
- Commit: `refactor(admin): typed entities, single API client and shared building blocks`

## Task 6 — Admin auth, shell and security

- [ ] `features/admin/auth/pin.ts` holds `normalizePin` and `pinError(pin, confirm?)`, returning the current Spanish messages. Add `pin.test.ts`.
- [ ] `features/admin/auth/use-admin-session.ts` exposes the state, `setup`, `login`, `logout` and `rememberSession`. It keeps the localStorage key `neoteam_admin_pin_session` and the bootstrap order (status, then validate).
- [ ] `features/admin/auth/auth-screen.tsx` covers checking, setup and login. It owns its PIN state.
- [ ] `features/admin/auth/pin-field.tsx`.
- [ ] `features/admin/security/change-pin-form.tsx` owns its PIN state and calls `rememberSession` with the new token.
- [ ] `features/admin/shell/admin-shell.tsx` holds the sidebar (driven by `adminSections`), the topbar, the section header and the sign-out button.
- [ ] `features/admin/admin-app.tsx` picks `AuthScreen` or `AdminShell` plus the current view.
- [ ] `app/admin/page.tsx` renders `<AdminApp />`. Delete `app/admin/admin-dashboard.tsx`.
- Check:
  - at 390, then 1440: auth (checking, setup, login with an error), every section, and change-PIN with an error and with success, all identical;
  - keyboard tab order is unchanged.
- Commit: `refactor(admin): split session, auth screen, shell and change PIN`

## Task 7 — Admin views

- [ ] `features/admin/overview/overview-view.tsx`: the metrics grid, plus quick access built from `adminSections`.
- [ ] `features/admin/participants/participants-view.tsx` contains:
  - the toolbar (search plus status filter);
  - the table;
  - attendance changes;
  - delete through `ConfirmPanel`.
- [ ] `features/admin/community/community-view.tsx` (`resource: 'groups' | 'brands'`) and `community-form.tsx`.
- [ ] `features/admin/raffles/raffles-view.tsx` (includes the draw confirmation) and `raffle-form.tsx`.
- [ ] Shared search filter: `features/admin/filter.ts` holds `matchesQuery(row, query)`, plus a test.
- [ ] Delete `app/admin/admin-management.tsx` and `app/admin/record-editor.tsx`.
- Check:
  - at 390, then 1440, every view in four states: list, empty, empty with filter, editor open;
  - the delete and draw confirmations;
  - mocked save, check-in, delete and draw send the same request bodies as on `main` (captured from `page.route` and diffed).
- Commit: `refactor(admin): one view per section`

## Task 8 — Logo carousel admin

- [ ] `git mv app/admin/logo-carousel-admin.tsx features/admin/logos/logos-view.tsx`. Rebuild it on `useAdminList`, `RefreshButton`, `LoadingState`, `EmptyState`, `RecordCard` and the inline two-step delete.
- [ ] `features/admin/logos/logo-form.tsx` on `EditorForm` and `ImageUploadField`.
- Check:
  - at 390, then 1440: list, empty, editor, upload error over 4 MB, delete confirmation, all identical;
  - same request bodies.
- Commit: `refactor(admin): logo carousel on shared building blocks`

## Task 9 — Docs

- [ ] `AGENTS.md` and `CLAUDE.md`:
  - the "Where things live" table gets a `features/` row and the feature import rules;
  - the Architecture paths are updated;
  - the line "No Tailwind/CSS modules" in CLAUDE.md is corrected.
- [ ] `docs/superpowers/plans/ok-2026-10-05-tailwind-and-icons.md`: rewrite the Task 4 file list to the new files, and set its status line.
- [ ] Measure before and after (`wc -l`) for the PR description.
- Check: `pnpm ci:check`.
- Commit: `docs: feature structure`

No changelog entry: nothing changes for users.

## After this plan (Iván)

- Review the screenshots and the PR, then push and merge.
- Approve the next plan: Santiago's `feat/qr-checkin`, built in `features/admin/checkin/`.
