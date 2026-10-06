# Dynamics admin panel — spec

Date: 2026-10-05 · Branch: `feat/dynamics-admin` (from `main` after `feat/qr-checkin`) · Status: **awaiting OK**

Source: Santiago's `feat/dynamics-mvp`. Its Edge Function work is already on `main`: commit `3213546` brought in the whole `dynamicData` engine, and `b1f8455` made the draws atomic. What is still missing is the panel, plus the migrations in the repo.

## Problem

On 18 Oct, sponsors run stands and challenges: scan the runner's QR at a stand, give points, run an instant-win, or draw a prize among the runners who visited a stand. `admin-pin` can already do all of it (`dynamicData`: `list`, `save`, `delete`, `complete`, `draw`), but there is no screen to use it.

Santiago's panel (`app/admin/dynamics-management.tsx`, 302 lines) cannot be merged as is:
- **It predates `features/`.** It edits `admin-dashboard.tsx` and `admin-management.tsx`, which no longer exist.
- **It repeats the list, editor, confirmation and loading code** that `features/admin/ui/` now holds.
- **It uses legacy CSS** in `neo-overrides.css` and Unicode glyphs (`↻`, `→`, `+`). `DESIGN.md` rules 6 and 9 forbid both.
- **Participation is a typed text field.** Stands need the camera.

## State to verify first (Task 0)

The two migrations on Santiago's branch (`20261005233028_dynamics_mvp.sql` and `20261005233800_index_dynamics_eligibility.sql`) are not in `main`. The atomic-draws migration on `main` already references `public.dynamics`, so the tables almost certainly exist in the remote project.

Iván runs these read-only queries:

```sql
select to_regclass('public.dynamics') as dynamics,
       to_regclass('public.dynamic_participations') as participations;

select count(*) as raffles_without_dynamic
from public.raffles r
where not exists (select 1 from public.dynamics d where d.legacy_raffle_id = r.id);

select type, status, count(*) from public.dynamics group by 1, 2 order by 1, 2;
```

- **If the tables exist:** both migrations go into the repo as they are, for history. They are idempotent (`if not exists`, `where not exists`, `on conflict`) and are not run again.
- **If they do not exist:** both migrations are run on the remote, from this approved plan.
- **If `raffles_without_dynamic > 0`:** the migration's raffle copy (its `insert … select`) is run again. It skips the raffles already copied.

## Decisions

1. **"Dinámicas" replaces "Rifas" in the admin.**
   - A raffle is one dynamic type (`raffle`), and every existing raffle was copied into `dynamics` (`legacy_raffle_id`).
   - Keeping both screens means two places to draw the same prize on event day, with two different winner lists.
   - The Rifas view (`features/admin/raffles/*`) and its nav entry are deleted.
   - The `raffles` table and the `adminData` raffle actions stay. Removing them belongs to the edge-function split plan.
   - **This is Santiago's choice too:** his branch swaps the nav entry.
   - The quick-access card becomes "Dinámicas · Stands, retos y sorteos".
2. **Five types in the form, out of the nine the backend accepts.**

   | Type | Label in the form | What it does |
   |------|-------------------|--------------|
   | `raffle` | Sorteo | Draw among eligible runners |
   | `qr` | Stand | Scan to register a visit |
   | `checkpoint` | Checkpoint | Scan to register a pass |
   | `challenge` | Reto | Staff marks the runner as done |
   | `instant_win` | Premio instantáneo | Each scan may win, up to N winners |

   - `trivia`, `mission`, `voting` and `points` behave exactly like `challenge` in the engine: `complete` plus points. Offering them would give staff four names for one behavior.
   - An existing row of a hidden type still shows its type's label (all nine labels stay in `labels.ts`) and can be edited.
   - **Rejected:** offering all nine. It is choice without meaning; add one when its behavior exists.
3. **Built from the shared admin blocks:**
   - `useRecords`-style loading on `dynamicData` (its response is `dynamicRows`, not `rows`, so the hook gets one small adapter or a sibling `useDynamics`);
   - `RecordCard`, `EditorForm` and `useEditor`;
   - `ConfirmPanel` for deleting and drawing;
   - `ListToolbar` with search and a type filter;
   - `EmptyState` and `StatusBadge`.

   New code is Tailwind on tokens, as in the QR spec.
4. **Registering a participation uses the QR scanner from spec 2** (`features/admin/ui/qr-scanner.tsx`), with the manual code field under it.
   - "Registrar participación" opens the scanner on that dynamic's card.
   - Each scan calls `complete` and shows the result:
     - "Ana Pérez · +10 pts";
     - "Ya estaba registrada";
     - "¡Ganó! Camiseta NeoTeam";
     - "Esta vez no hubo premio".
   - The scanner stays open for the next runner.
5. **Drawing a raffle shows the winners**, using `winnerDetails` from `draw`: each winner's name, code and group, in a list staff can read aloud.
   - Santiago's version only showed a count.
   - The draw stays behind `ConfirmPanel` ("Confirmar y sortear"), as raffles do today.
6. **The instant-win form** asks for "Probabilidad de ganar (%)", from 0 to 100. It is stored as `config.win_probability` (0 to 1), as the engine expects.
   - The form also asks for the maximum number of winners (`winner_count`).
7. **Overview:**
   - the "Rifas" metric becomes "Dinámicas" (`metrics.dynamics`, which `main` already returns);
   - the type `Metrics` gets `dynamics` and drops `raffles` once the Rifas view is gone.
8. **Icon:** `Zap` for the "Dinámicas" section. It is added to the `DESIGN.md` vocabulary.
   - `Gift` keeps meaning prizes, and `Dices` keeps meaning the draw button.

**Ported from Santiago:**
- the types `DynamicRow` and `DynamicParticipant`;
- the state and type labels;
- the editor fields, including eligibility: "Participan quienes completaron…";
- the result messages.

## Security

- Nothing new: everything goes through `/api/admin` → `admin-pin` (proxy secret, session).
- The draws already use the atomic RPCs on `main`.

## Mobile

- At **390 px**, the stand flow is:
  1. open "Dinámicas";
  2. tap the stand's card;
  3. tap "Registrar participación";
  4. scan, scan, scan.

  It works one-handed, with targets of at least 44 px.
- The draw's winner list is readable at arm's length: name at 18 px or more.
- No new dependency; the scanner is shared with check-in.

## Out of scope

- The behavior of the hidden types (trivia questions, voting options).
- A public leaderboard of points.
- Deleting the `raffles` table or its Edge actions.
