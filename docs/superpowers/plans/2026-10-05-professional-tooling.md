# Professional tooling — plan

Spec: `docs/superpowers/specs/2026-10-05-professional-tooling-design.md`. Branch: `chore/professionalize-tooling`. Status: **awaiting OK**.

One commit per task. Each task ends with the check named in it; the last one ends with `pnpm ci:check` green.

---

## Task 1 — Save the code review

- [x] `docs/superpowers/audits/2026-10-05-code-review.md` written (findings ranked; H1/H2/M1 re-verified). Commit it with this plan.
- Commit: `docs: add 2026-10-05 code review audit`

## Task 2 — Explicit button types

- [ ] Restore `git stash` "wip: explicit button types" (24 buttons across `app/admin/admin-dashboard.tsx`, `admin-management.tsx`, `logo-carousel-admin.tsx`, `record-editor.tsx`).
- [ ] Rule applied: `onClick` → `type="button"`; no `onClick` (inside `<form>`) → `type="submit"`. Verify each of the 5 `submit` buttons sits inside a `<form onSubmit>`: dashboard lines ~324, ~344, ~467; logo editor ~388; record editor ~264.
- Check: `pnpm exec biome lint app/admin --only=a11y/useButtonType` → 0.
- Commit: `fix(admin): give every button an explicit type`

## Task 3 — Honest hook dependencies

- [ ] `app/admin/admin-management.tsx`: move `errorText` to module scope (pure function).
- [ ] `app/admin/admin-dashboard.tsx`: `loadCards` becomes `useCallback(…, [])` (it only uses the module-level `callAdminApi` and the stable `setCards`) and is added to the bootstrap effect's dependency list.
- [ ] `components/horizontal-carousel.tsx:18`: effect deps `[children]` → `[]` (audit L11: it re-subscribed on every render); a `MutationObserver` (`childList`) on the track re-observes new slides and re-measures.
- [ ] `app/admin/admin-dashboard.tsx:59`: drop the no-op `useCallback(callAdminApi, [])` and pass `callAdminApi` directly.
- [ ] `components/horizontal-carousel.tsx:30`: replace `forEach` with `for…of`.
- Check: `pnpm exec biome lint . --only=correctness/useExhaustiveDependencies --only=suspicious/useIterableCallbackReturn` → 0.
- Commit: `fix: honest hook dependencies`

## Task 4 — Accessibility and keys

- [ ] `components/horizontal-carousel.tsx`: wrapper `div role="region"` → `<section aria-label aria-roledescription>`; track gets `role="group"` and keeps `tabIndex={0}` + `onKeyDown` with `// biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region must be keyboard reachable` (and the same for `noStaticElementInteractions` if it remains).
- [ ] `app/page.tsx:24`: `.v2-hero-meta` gets `role="group"`.
- [ ] `app/admin/admin-management.tsx:229`: drop `role="region"` from the `<section>`.
- [ ] `components/community-carousel.tsx:44,46`: move the logo/name JSX into a `logoContent(item)` helper outside `map`.
- [ ] `components/logo-marquee.tsx`: build `image` through a `logoImage(item, hidden)` helper; keep `` key={`${item.id}-${index}`} `` with `// biome-ignore lint/suspicious/noArrayIndexKey: items repeat on purpose to fill the marquee`.
- [ ] `biome.json`: override `app/admin/**` → `a11y/noAutofocus: off`.
- Check: `pnpm exec biome lint app components` → 0 errors. `pnpm build`; manual pass **at 390 px first** (carousel swipe, login focus not opening the keyboard unexpectedly on admin forms), then desktop (arrow keys on the track).
- Commit: `fix: carousel semantics, list keys and admin autofocus rule`

## Task 5 — No `any` in the admin edge function

- [ ] `supabase/functions/admin-pin/index.ts`: replace the 8 `any` with the types in the audit's `any` table (`ParticipantRow`, `DynamicRow`, `{ registration_id: string }`, …), declared at the top of the file. Types only: no runtime change. (`supabase gen types` + dropping `@ts-nocheck` is a later plan.)
- Check: `pnpm exec biome lint supabase` → 0 errors; `git diff --stat` touches only that file; diff reviewed for runtime-neutral changes.
- Commit: `refactor(edge): replace any with explicit types in admin-pin`

## Task 6 — Test runner and first tests

- [ ] `tsconfig.json`: `"allowImportingTsExtensions": true`.
- [ ] `lib/registration-schema.ts`: move `registrationSchema` out of `app/registro/actions.ts` (no `@/` imports); `actions.ts` imports it.
- [ ] `lib/registration-schema.test.ts`: valid payload passes; `runningGroup: 'otro'` without `otherRunningGroup` fails on that path; invalid email, unchecked terms and bad birth date fail.
- [ ] `lib/admin-proxy.ts`: `parseAdminBody(request)` (JSON or gzip with the 6 MB output cap, object with string `action`) and `upstreamHeaders(request, key)` (the `VERCEL === '1'` IP rule); both `app/api/admin/route.ts` and `app/api/admin/logos/route.ts` use them. The logos route keeps its current upstream-error behaviour (behaviour fixes come from the audit plan).
- [ ] `lib/admin-proxy.test.ts`: missing `action`, array body, plain JSON, gzip body, gzip over the cap → rejected; IP forwarded only when `VERCEL=1`.
- Check: `pnpm test` → all pass; `pnpm typecheck`; `pnpm build`.
- Commit: `test: node test runner with registration and admin proxy tests`

## Task 7 — CI on pull requests

- [ ] `.github/workflows/ci.yml`: `on: pull_request` to `main` (`opened, synchronize, reopened, ready_for_review`), skip drafts, `concurrency: ci-${{ github.event.pull_request.number }}` with `cancel-in-progress`; steps `actions/checkout@v5`, `pnpm/action-setup@v5`, `actions/setup-node@v5` (`node-version-file: .nvmrc`, `cache: pnpm`), `pnpm install --frozen-lockfile`, `pnpm ci:check`.
- Check: `pnpm ci:check` green locally (first full green run).
- Commit: `ci: run pnpm ci:check on ready pull requests`

## Task 8 — Deploy hygiene

- [ ] `vercel.json`: `framework: nextjs`, `installCommand: pnpm install --frozen-lockfile`, security headers on `/(.*)`: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: DENY`.
- [ ] `README.md`: development section → pnpm commands; remove the "npm blocked" note.
- Check: `pnpm build`; after Iván pushes, the Vercel preview loads `/`, `/registro`, `/admin` and the response carries the headers (`curl -I`).
- Commit: `chore(deploy): vercel config with security headers`

## Task 9 — Design reference

- [ ] `DESIGN.md`: **mobile-first standing rule** (390 px base, `min-width` queries, 44 px touch targets, `inputmode`/`autocomplete` on forms); current tokens (`--neo-*`, `--space-*`, `--radius-*`), Host Grotesk scale, CSS layer order, reduced-motion rule, public vs admin surfaces, standing rules (tokens over raw hex; new home styles in `home-v2.css`; every interactive element keyboard-reachable with visible focus).
- [ ] `design/README.md`: what goes in `design/` (studies, mockups, references), naming `YYYY-MM-DD-<topic>.<ext>`.
- Check: every token named in `DESIGN.md` exists in `app/*.css` (`grep`).
- Commit: `docs: add DESIGN.md and design studies folder`

---

## After this plan (Iván)

- Push the branch, open the PR, confirm the first green CI run and the Vercel preview.
- Enable branch protection on `main` requiring the `CI` check.
- Approve a follow-up spec for the audit's security/correctness findings.
