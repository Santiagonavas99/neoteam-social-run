# Plan — Fix registration running groups

Spec: `docs/superpowers/specs/2026-10-07-registration-running-groups-fix-design.md`

Branch: `fix/registration-running-groups`

Status: **approved 2026-10-07**.

Release: `0.26.4` — bug fix on top of the current `0.26.3` baseline.

## 1. Normalize crew rows and existing registrations

Database:
- insert/upsert missing canonical rows for Neo Team and United Runner Club;
- normalize canonical slugs used by the form;
- backfill the six current SR26 null/null registrations to Neo Team after re-verifying that no genuine independent registrations are null/null;
- backfill exact known `other_running_group` names to relational IDs;
- keep unmatched custom crews untouched.

Checks:
- query every repaired registration;
- compare group distribution before/after;
- run security advisors.

## 2. Make the registration RPC fail closed

Database migration:
- preserve the existing RPC signature and grants;
- `otro` remains the only free-text path;
- every other slug must resolve to an active row;
- unknown/inactive slug raises `Grupo de running inválido`;
- never silently write both group fields null.

Checks:
- direct SQL transaction tests for known, independent, custom and invalid slugs.

## 3. Stop converting known crews to free text

Files:
- `features/registration/actions.ts`
- `features/registration/running-groups.ts`
- registration schema/tests.

Changes:
- send the selected canonical slug directly for every known crew;
- send free text only for `otro`;
- align form slugs with DB: `run-365`, `pacific-runners`, etc.;
- remove the `listedExternalRunningGroupName` conversion helper if no longer needed.

## 4. Regression tests

Cases:
- Neo Team;
- Independiente;
- ByRunners;
- Run 365;
- Pacific Runners;
- United Runner Club;
- Otro crew;
- invalid slug.

Verify participant display and metrics use relational groups.

## 5. Release 0.26.4

- bump `package.json`;
- add `Fixed` entry to `CHANGELOG.md`;
- CI green;
- SQL tests green;
- Vercel preview READY;
- no production deploy until explicitly requested.
