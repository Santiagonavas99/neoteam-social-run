# Better draws and dynamics — plan

Spec: `docs/superpowers/specs/2026-10-07-better-draws-design.md` · Branch: `feat/better-draws` (also carries the "Activar" commit from `ok-2026-10-07-activate-dynamics.md`; one release, 0.15.0, per Iván)

## Tasks (one commit each)

1. **`feat(db): category on registration`**
   - New file `supabase/migrations/<ts>_registration_gender.sql`. It drops and recreates `register_social_run_participant` from the remote definition, adding `p_gender text default null`, which is written to `registrations.gender`, and re-grants `execute` to `anon` and `authenticated`.
   - Check: a remote `begin … rollback` that registers with `p_gender => 'female'` and reads the row back.
2. **`feat(db): one eligibility rule for draws, replacement winners and ranking`**
   - New file `supabase/migrations/<ts>_better_draws.sql`, with:
     - `dynamic_eligible_registrations`;
     - `dynamic_eligible_count`;
     - `draw_dynamic`, rewritten to draw from the eligible set;
     - `redraw_dynamic_winner`;
     - `dynamic_points_ranking`.
   - `execute` is granted to `service_role` only.
   - New file `supabase/tests/better_draws.sql`, covering:
     - category filter;
     - excluded previous winners;
     - an absent runner is never drawn again;
     - count equals the draw pool;
     - ranking order and ties.
   - Check: the test runs inside a remote `begin … rollback`, so no local database is needed.
3. **`feat(registration): ask for the category`**
   - `features/registration/schema.ts` gets `gender` (`female | male | prefer_not_to_say`), with a test.
   - `registration-form.tsx` gets the `SelectField` after the birth date.
   - `actions.ts` sends `p_gender`.
   - Check: `node --test` on the schema, and Playwright `/registro` at 390 px.
4. **`feat(admin): category in Participantes`**
   - `participants` writable gains `gender` in `admin-pin`.
   - `participants-view.tsx` gets a category select per row.
   - `labels.ts` gets `genderLabels`.
   - Check: Playwright at 390 px with mocked `adminData`.
5. **`feat(admin): raffle category, no repeated winners and eligible count`**
   - `admin-pin` `save` validates `config.gender` and `config.exclude_winners`; new operation `eligibleCount`.
   - `dynamic-form.tsx` gets the raffle Categoría and "No repetir ganadores".
   - `dynamics-view.tsx` adds new raffles with `exclude_winners: true`, and the confirm panel shows the count, disabling at 0.
   - Check: Playwright at 390 px, then 1440.
6. **`feat(admin): winners stay visible, replace an absent winner, reveal one by one`**
   - `admin-pin` gets new operations `winners` and `redraw`.
   - `draw-result.tsx` reveals winners one by one, with "No está · sortear otro".
   - `use-dynamics.ts` gets `showWinners` and `redraw`.
   - `dynamics-view.tsx` gets "Ver ganadores" on completed raffles.
   - Check: Playwright at 390 px. Draw, reveal, replace the second winner: the order is kept.
7. **`feat(admin): points ranking`**
   - `admin-pin` gets the `ranking` operation.
   - New file `features/admin/dynamics/ranking.tsx`, shown in `dynamics-view.tsx`.
   - Check: Playwright at 390 px; hidden when empty.
8. **`docs: draws`**
   - DESIGN.md gets the icon rows (`UserX`, `ListOrdered`).
   - CLAUDE.md gets the eligibility function and the new operations.
9. **`chore(release): 0.15.0`**, covering the Activar button too
   - CHANGELOG and `package.json`.
   - Check: `pnpm ci:check` exit 0.

## Rollout (Iván)

1. Merge this branch (`feat/activate-dynamics` is superseded).
2. Apply both migrations to the remote. I run the `rollback` dry runs first and show the result.
3. Deploy the function: `supabase functions deploy admin-pin --project-ref ohatsnkgaeccltqwhkbv`.
