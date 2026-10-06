# Cyan palette refresh — implementation plan

Spec: `docs/superpowers/specs/2026-10-05-cyan-palette-design.md`  
Branch: `feat/cyan-accent-refresh`

## 1. Establish palette primitives and semantic mappings

Files:
- `app/globals.css`
- `app/tailwind.css`
- `DESIGN.md`

Changes:
- Add the complete cyan and neutral ramps from the approved design reference.
- Map existing semantic `--neo-*` tokens to the ramp.
- Add a dedicated focus token instead of using the brand cyan where contrast is insufficient.
- Expose any semantic tokens needed by existing Tailwind utilities.
- Document light/dark mappings and usage rules.

Checks:
- No supplied palette value is altered.
- Brand cyan remains exactly `#03f8f6`.
- Accent text on light surfaces does not use the brand cyan.
- Focus remains visibly distinct on the light neutral background.

Commit: `style: define NeoTeam cyan palette`

## 2. Remove legacy green tint from existing UI

Files:
- `app/globals.css`
- `app/home-v2.css`
- `app/neo-overrides.css`

Changes:
- Replace greenish legacy neutrals, teal one-offs, borders, fills and text colors with the new palette/semantic tokens.
- Keep danger/error colors semantic.
- Do not change layout, spacing, typography or component behavior.
- Prefer semantic tokens in component rules rather than direct ramp values.

Checks:
- Search the three stylesheets for legacy green values and confirm intentional leftovers only.
- Home, registration and admin preserve hierarchy and readable contrast.
- No selector or responsive behavior changes accidentally.

Commit: `style: apply cyan neutrals across the interface`

## 3. Mobile-first visual and accessibility pass

Files:
- Only the three CSS files above if a contrast correction is required.

Checks:
- 390 px first: home, registration and admin.
- Then 1024 px and 1440 px.
- Keyboard focus is visible on links, buttons, inputs and carousel controls.
- Bright cyan is not used as small text on a light surface.
- Filled cyan controls use a text color with sufficient contrast.
- No horizontal overflow introduced.

Commit only if corrections are needed: `fix: tune cyan palette contrast`

## 4. Release notes and version

Files:
- `CHANGELOG.md`
- `package.json`

Changes:
- Describe the full palette adoption under the release notes.
- Finish the PR with the next available patch version because this is a visual refinement, rebasing first if another PR lands.

Checks:
- Version and changelog section match.
- Release commit is the final commit in the PR.

Commit: `chore(release): <next-patch>`

## Final verification

Run:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm ci:check`

Vercel preview is useful for the visual pass but is not a substitute for the repository checks. If Vercel is still blocked by `build-rate-limit`, report that separately from code/build results.
