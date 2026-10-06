# AGENTS.md

Rules for every coding agent (Claude Code, Codex, Cursor, OpenCode, Gemini…) working in this repository. Project owner: Iván Andrés López.

## Workflow: design → spec → plan → OK → code

No code, config or dependency change starts without an approved plan. The order is fixed:

1. **Review the design first.** Before proposing anything that touches UI, read:
   - `DESIGN.md` (design system and its standing rules; if it does not exist yet, say so and treat creating it as the first task),
   - the design studies in `design/` (mockups, explorations, references),
   - the `frontend-design` skill (`.agents/skills/frontend-design/SKILL.md`).

   For non-UI work, still read the relevant constraints: this file, `CLAUDE.md` and the `docs/superpowers/` specs that cover the area.
2. **Write the spec** at `docs/superpowers/specs/YYYY-MM-DD-<slug>-design.md`: the problem, the decision and why, alternatives rejected, design and security constraints that apply, out of scope.
3. **Write the plan** at `docs/superpowers/plans/YYYY-MM-DD-<slug>.md`: link to the spec, the branch name, numbered tasks (one commit each) naming the exact files, and the checks that prove each task.
4. **Stop and wait for an explicit OK from Iván.** Do not implement in the same turn. Once approved, rename the plan to `ok-YYYY-MM-DD-<slug>.md`.
5. **Implement only what the approved plan says.** If reality diverges from the plan, stop, update the plan and ask again.

Trivial fixes (typo, one-line copy change) may skip the spec, never the OK.

## Where things live

| Path | Content |
|------|---------|
| `DESIGN.md` | Design system: tokens, typography, components, standing rules |
| `design/` | Design studies: mockups, HTML explorations, references, screenshots |
| `docs/superpowers/specs/` | Specs (`…-design.md`) |
| `docs/superpowers/plans/` | Plans; `ok-` prefix once approved |
| `docs/superpowers/audits/` | Code reviews and audits (`YYYY-MM-DD-<topic>.md`) |
| `.agents/skills/` | Skills shared by all agents |

Code reviews are written to `docs/superpowers/audits/`, never only left in chat.

## Mobile first

Most participants register from a phone, and staff run check-in, scans and draws from phones on event day. Mobile is the primary target:

- Design and build at **390 px first**, then scale up (1024, 1440). In CSS, base styles are mobile and `min-width` media queries (Tailwind `md:`/`lg:`) add desktop.
- Touch targets ≥ 44×44 px, no hover-only interactions, inputs use the right `type`/`inputmode`/`autocomplete`.
- Every spec has a *Mobile* section; every plan's checks include a pass at 390 px (real device or emulation) **before** desktop.
- Performance on mid-range phones over 4G counts: no new client-side dependency without a mobile cost note.

## Code rules

- All code, identifiers, file names and comments in **English**. User-facing copy stays in **Spanish**.
- Comments only for non-obvious logic.
- TypeScript strict (`tsconfig.json`). No `any`: use `unknown` plus type guards or interfaces.
- Biome is the linter and formatter (2 spaces, single quotes, no semicolons). Run `pnpm lint:fix` before committing.
- pnpm only (`packageManager` is pinned). Never add `package-lock.json` or `yarn.lock`.
- No dependency added, removed or upgraded without approval.
- No new top-level folders without approval.

## Security boundaries

- The browser never queries Supabase tables directly. Public writes go through RPCs (`register_social_run_participant`); admin operations go through `/api/admin*` → Edge Functions.
- Never put a service-role key, `ADMIN_SETUP_SECRET` or a PIN in the repo, in a `NEXT_PUBLIC_*` variable or in chat.
- The remote Supabase project is the schema's source of truth: never run an initial schema against it. New migrations only, and only from an approved plan.

## Checks

```bash
pnpm lint        # Biome
pnpm typecheck   # next typegen + tsc
pnpm test        # node --test on **/*.test.ts
pnpm build
pnpm ci:check    # all of the above

docker compose up -d db   # local Supabase Postgres on :54322 (SQL tests only)
pnpm test:db              # each supabase/tests/*.sql in a throwaway database
docker compose down
```

SQL tests pull in the migrations they need with `\ir ../migrations/<file>.sql`; tables that exist only in the remote schema must be created by the test itself.

A task is done when `pnpm ci:check` passes. Say so with the output; if something fails, report it, do not hide it.

## Changelog

- `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and SemVer.
- Every PR adds its user-visible changes under `## [Unreleased]`, in the right group (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`), written for the reader of a release note.
- Never bump `package.json` `version`, create a version section or tag a release unless Iván asks.
- Cutting a release (only when Iván asks): in one PR, set `package.json` `version` to `x.y.z` and rename `## [Unreleased]` to `## [x.y.z] - YYYY-MM-DD`, adding an empty `## [Unreleased]` above it. When the PR merges into `main`, `.github/workflows/release.yml` tags `vx.y.z` and publishes a GitHub release with that section as notes. With no matching section, the workflow does nothing.

## Git

- Never commit to `main`. One branch per plan, one commit per task, Conventional Commits (`feat:`, `fix:`, `chore:`…).
- Do not push, open PRs or deploy without being asked.
