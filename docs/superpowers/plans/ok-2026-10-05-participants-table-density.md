# Participant table density and state control — plan

Spec: `docs/superpowers/specs/2026-10-05-participants-table-density-design.md`. Branch: `feat/participants-table-polish` (PR #15). Status: **approved 2026-10-06**.

One implementation commit. No dependency, API, schema or configuration changes.

## Task 1 — Refine the participant roster

- [x] Rename this file to `ok-2026-10-05-participants-table-density.md` after Iván's explicit approval.
- [x] `app/admin/admin-management.tsx`: keep the current data and actions, refine only the participant table markup where needed so identity, registration and status/actions have clear internal grouping and accessible labels.
- [x] `app/neo-overrides.css`: tighten desktop row/header spacing and column proportions; align the state dot, label and chevron; refine delete-button alignment and feedback; make the summary wrap without horizontal scrolling; provide a 390 px single-card layout with ≥44 px controls.
- [x] `CHANGELOG.md`: add the participant-table visual refinement under `## [Unreleased]` → `Changed`.
- [x] Run `pnpm lint:fix`, then `pnpm ci:check`.
- [ ] Verify at **390 px first**, then 1024 and 1440 px: no horizontal page/table scroll, long name/email handling, all four state colors, state change/loading feedback, keyboard focus, confirmation before delete and ≥44 px mobile controls.
- [ ] Review the final screenshots against the supplied baseline. Do not commit screenshots containing real participant data.
- [x] Commit as `style(admin): refine participant table hierarchy` and push the existing PR #15 branch.

Browser note: the local Next server starts on `127.0.0.1`, but the available browser runner is not installed and the remote browser blocks loopback URLs. The production build and full CI suite pass; final visual review remains available through the PR preview.

If the current component structure or CSS cascade requires changes outside these files, stop and update this plan before implementation.
