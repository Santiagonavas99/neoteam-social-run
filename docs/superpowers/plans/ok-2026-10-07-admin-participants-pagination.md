# Plan — Admin participants pagination

Spec: `docs/superpowers/specs/2026-10-07-admin-participants-pagination-design.md`

Branch: `feat/admin-participants-pagination`

Status: **approved 2026-10-07**.

Release: `0.27.0` based on the current `0.26.3` main baseline. Rebase/version again only if another minor release lands first.

## 1. Server-side participant paging

Files:
- `supabase/functions/admin-pin/index.ts`
- relevant Edge Function tests if present

Changes:
- special-case `participants / list`;
- accept page, query and status only when the client opts in with `paginated: true`, preserving the current production client;
- fixed page size 25;
- query only the requested range;
- return exact filtered count plus global SR26 status counts;
- keep event scoping and newest-first ordering;
- add a dedicated participant backup operation that returns all SR26 registrations for CSV export.

Checks:
- page 1 returns max 25;
- page 2 has the next records with no overlap;
- invalid/negative page clamps safely;
- status filter count and rows agree;
- search works across name/contact/code/crew;
- backup operation returns all event registrations independent of paging.

## 2. Participant pagination state and UI

Files:
- `features/admin/participants/participants-view.tsx`
- `features/admin/types.ts`
- optionally a small pagination helper/test under `features/admin/participants/`

Changes:
- ParticipantsView stops using generic `useRecords('participants')` for list loading;
- keep existing mutation actions but load paged participant data directly;
- debounce search;
- reset page on query/status changes;
- render only the current page;
- add Previous / Page X of Y / Next navigation;
- show `Mostrando A–B de N participantes`;
- status chips use server totals;
- clamp page after deletes.

Checks:
- 390 px first: page controls, search, filters, expanded row, delete flow;
- 1440 px;
- no horizontal overflow;
- only current page rows render.

## 3. Preserve full backup export

Files:
- `features/admin/participants/participants-view.tsx`
- existing backup-list tests if needed

Changes:
- “Descargar lista” explicitly requests the full backup dataset;
- preserve the existing CSV builder and filename;
- button has a temporary loading state while downloading;
- current search/status/page never changes CSV contents.

Checks:
- from page 3 with an active filter, downloaded CSV still contains the full event list;
- no duplicate request on double click while busy.

## 4. Release and verification

Files:
- `CHANGELOG.md`
- `package.json`

Changes:
- bump to the next available minor version;
- document paginated participant management.

Final checks:
- `pnpm ci:check`;
- SQL tests;
- Vercel preview `READY`;
- deploy updated `admin-pin` only after the approved implementation is ready;
- no production merge/deploy until explicitly requested.
