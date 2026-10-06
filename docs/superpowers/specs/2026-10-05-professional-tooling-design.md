# Professional tooling — spec

Date: 2026-10-05 · Branch: `chore/professionalize-tooling` · Status: **awaiting OK**

## Problem

The repo was an MVP: npm, no linter, no tests, a CI that only typechecks and builds on every push, no design reference and no agent rules. Iván's other projects (distriweb-pro, Product-Manager, djeddy) share one setup: pnpm, Biome, Node 22, CI on pull requests, `DESIGN.md`, and `docs/superpowers/` for specs, plans and audits. This project has to match them before the event (18 Oct 2026) without risking the live registration.

Already done on the branch (commits `b571514`, `daaeb11`, `92787f3`, `4f7d2a3`): pnpm, TypeScript 7 strict, Biome formatting, `AGENTS.md`/`CLAUDE.md`, `pnpm ci:check`. `pnpm ci:check` fails today because `pnpm lint` reports 52 errors.

## Design review

- `DESIGN.md` and `design/` do not exist. The live design system is implicit in `app/globals.css` (`:root` tokens `--neo-*`, `--space-*`, `--radius-*`), overridden in layers by `neo-overrides.css` → `logo-marquee.css` → `home-v2.css` (the editorial v2 home). It already respects `prefers-reduced-motion`.
- `frontend-design` skill: no visual redesign is in scope. The rules that apply here are the quality floor (visible keyboard focus, reduced motion, accessible controls) and keeping CSS specificity under control. The 14 `noDescendingSpecificity` warnings are evidence of the layered overrides; they are documented, not refactored, in this plan.
- No change in this plan alters what the user sees, except the button `type` attributes, which keep the current behaviour (see Decisions).

## Decisions

1. **Lint to green, behaviour unchanged.**
   - `useButtonType` (24): a button with `onClick` gets `type="button"`; a button without it sits inside a `<form>` and gets `type="submit"`, which is what the browser already does today.
   - Hooks: `errorText` and `loadCards` move out of the render scope (module level / `useCallback`) so the dependency lists are honest. The carousel effect keeps `children` as a deliberate re-measure trigger, using `biome-ignore` with a reason.
   - Accessibility: the carousel wrapper becomes `<section>`; the scroll track keeps `tabIndex={0}` (a scrollable region must be keyboard-reachable, axe `scrollable-region-focusable`) with `role="group"`, using `biome-ignore` with a reason; `aria-label` on role-less `div`s gets `role="group"`; the redundant `role="region"` on a `<section>` is removed.
   - Keys: the JSX built inside `map` callbacks moves to small helpers; the marquee keeps its index key (items are repeated on purpose, so ids are not unique), with `biome-ignore`.
   - `noAutofocus` is turned off for `app/admin/**` only: moving focus into the opened editor, dialog or login field is the intended admin UX.
   - `noExplicitAny` (8, `supabase/functions/admin-pin/index.ts`): each one is replaced with a concrete interface or `unknown` plus a guard. This is the only `any` in the repo; Iván's rule bans it.
   - Warnings (CSS specificity, `!important`, `Deno.env.get()!`, the admin `<img>`) do not fail CI and stay as warnings.
2. **Tests: Node's built-in runner, no new dependency.** `node --test` with `--experimental-strip-types` (Node 22) was checked against a module importing zod. It needs `allowImportingTsExtensions` (valid because `noEmit`), and a tested module must not import the `@/` alias. First tests:
   - the registration schema, extracted from `app/registro/actions.ts` to `lib/registration-schema.ts` (pure, no alias);
   - the admin proxy body parser (`action` required, rejects arrays/non-objects, gzip with output cap), extracted to `lib/admin-proxy.ts` and shared by both proxy routes.

   Rejected: Vitest. It is one more dependency for two pure modules; revisit when component tests are needed.
3. **CI** (`.github/workflows/ci.yml`), modelled on distriweb-pro: runs on pull requests to `main` that are ready for review (not drafts), with `concurrency` to cancel superseded runs. Steps: `pnpm/action-setup` (version from `packageManager`), `setup-node` with `node-version-file: .nvmrc` and the pnpm cache, `pnpm install --frozen-lockfile`, `pnpm ci:check`. Pushes to `main` no longer run CI: `main` only receives validated PRs.
4. **Deploy** stays on the existing Vercel Git integration (preview per branch, production from `main`). Vercel reads pnpm from `packageManager` and Node from `engines`. A `vercel.json` adds security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`), the same set as djeddy. **CSP is out of scope**: Next inline scripts and Supabase image hosts need a nonce-based policy and its own spec.
5. **Design reference.** `DESIGN.md` documents the current system as it is (tokens, type: Host Grotesk, CSS layer order, reduced motion, admin vs public surfaces) and lists standing rules (use tokens, never raw hex in new CSS; new home styles go to `home-v2.css`). `design/README.md` explains what goes in `design/`. The studies themselves are added when Iván provides them.
6. **Code review** is saved as `docs/superpowers/audits/2026-10-05-code-review.md`. Its security and correctness findings get **their own spec and plan**; this plan only fixes what lint requires.

## Mobile

`DESIGN.md` records mobile-first as a standing rule (390 px base, `min-width` queries, 44 px touch targets). The lint fixes in admin (button types, autofocus) are checked at 390 px first. The CI does not test viewports; that is a manual check in each plan.

## Out of scope

Visual changes, CSP, Supabase schema/migrations, `supabase db pull`, Deno type-checking of edge functions (no `deno` in CI yet), the audit's behavioural fixes, the README rewrite.

## Risks

- Changing `admin-pin` types touches the auth function. Mitigation: types only, no runtime change; it is redeployed only when Iván deploys edge functions.
- Branch protection on `main` (CI required) is a GitHub setting Iván enables after the first green run.
