# Better draws and dynamics — spec

Date: 2026-10-07 · Branch: `feat/better-draws` (from `feat/activate-dynamics`) · Status: **approved** (Iván, 2026-10-07: "hazlo todo en el mismo release")

## Problem

Iván, 2026-10-07: "revisa los sorteos: si son 2 premios, poner uno para categoría hombre y otro para mujer, etc., y mejorar los sorteos y las demás dinámicas que encuentres".

A review of the engine (`admin-pin` → `draw_dynamic` / `record_dynamic_participation`, remote data 2026-10-07):

1. **There is no category.** `registrations.gender` already exists on the remote, with the check `female | male | non_binary | prefer_not_to_say | other`, but the form never asks for it and `register_social_run_participant` has no parameter for it. Every row is null.
2. **The same runner can win every raffle.** `draw_dynamic` only excludes nobody; with two raffles, one person can take both prizes.
3. **The winners disappear.** They are shown once, in the panel that opens after "Sortear". After a reload, a completed raffle only says "1 ganador", with no name.
4. **No plan B when a winner is not there.** On event day the name is called and the runner has left. Today the only way out is to edit the raffle back to Activa and draw it all again, which throws away the other winners.
5. **"Sortear" fires blind.** The confirmation does not say how many people are in the draw, so a raffle with 2 eligible runners looks the same as one with 200.
6. **Points go nowhere.** Stands, checkpoints and challenges award points, but nothing adds them up: there is no ranking.
7. **Leftovers:** the remote has 23 draft raffles (tests). "Eliminar borradores" already removes them; no code is needed.

The rest works as intended: activating (0.15.0), scans, the instant-win cap under a row lock, and raffles limited to whoever completed another dynamic.

## Decisions

### 1. Category on registration

- **New required field** in step 01 of `/registro`, next to the birth date: **Categoría**, with Femenina (`female`), Masculina (`male`) and Prefiero no decir (`prefer_not_to_say`).
  - Hint: "Para los premios por categoría."
- **Database:** a migration replaces `register_social_run_participant` with the same body plus `p_gender text default null`, keeping its grants. It is copied from the remote definition, so nothing else changes.
- **Runners already registered:** the admin can set their category in Participantes. The `participants` resource lets admins write `gender`, and each row gets a small select. Today that is 3 people.

### 2. Raffle options (stored in `dynamics.config`, no new columns)

- **Categoría:** Todas, Femenina or Masculina (`config.gender`).
  - A category raffle only includes runners with that category. "Prefiero no decir" and empty only enter the "Todas" raffles.
  - For two prizes, one per category, staff create two raffles: "Bici · Femenina" and "Bici · Masculina".
- **"No repetir ganadores"** (`config.exclude_winners`), on by default for new raffles. When on, anyone who already won another raffle or instant prize of the event is left out.

### 3. One eligibility rule in SQL

- A new function, `dynamic_eligible_registrations(dynamic_id)`, is the single place that applies every rule:
  - not cancelled;
  - check-in, if the raffle requires it;
  - the linked dynamic, if any;
  - the category;
  - previous winners, when "No repetir ganadores" is on;
  - runners already marked absent for this raffle.
- `draw_dynamic` draws from it, and `dynamic_eligible_count` counts from it, so the count and the draw always agree.

### 4. Before drawing: "Participan N personas"

- The confirmation panel asks for the count (`eligibleCount`) and shows it.
- With 0, the confirm button is disabled and the panel says why.
- With fewer people than prizes, it warns that only N winners will come out.

### 5. Winners that stay, and a replacement

- **Completed raffles get "Ver ganadores".** It opens the same `DrawResult` panel from a new `winners` operation.
- **Each winner has "No está · sortear otro".** After a confirmation:
  - `redraw_dynamic_winner` marks that participation `disqualified`;
  - it draws one replacement from the eligible pool, which excludes the current winners and anyone marked absent;
  - it is atomic under the same row lock as the draw.
- **The order is kept.** The replacement takes the absent winner's place in the list.

### 6. Revealing winners on event day

`DrawResult` shows the winners one at a time, with a "Siguiente ganador" button. This builds suspense when the screen is projected.
- With reduced motion, or with a single winner, the list shows at once.
- No library: one `useState` index.

### 7. Points ranking

- A "Ranking" card at the top of Dinámicas shows the top 10 runners by points:
  - points are the sum of `points_awarded` over their completed or won participations;
  - ties go to whoever reached that score first.
- It comes from a new function, `dynamic_points_ranking(event_id)`, through the `ranking` operation.
- It is hidden while nobody has points.

## Alternatives rejected

- **One raffle with several prizes and categories inside:** one form doing the work of two, and much harder to explain on event day. Two raffles do the same job, and each has its own winners list.
- **Inferring the category from the name:** wrong too often, and not our call.
- **Age categories** (birth date is already stored): nobody asked for them. The eligibility function makes adding them a single line later.
- **Excluding previous winners always, with no switch:** a "premio a todos los que completaron X" raffle legitimately repeats winners.
- **Deleting an absent winner instead of marking them `disqualified`:** the record of who was called and was not there would be lost, and they could be drawn again.

## Design constraints

- Tokens and existing admin components only (`ConfirmPanel`, `DrawResult`, `RecordCard`, `StatusBadge`).
- **Icons** (DESIGN.md table):
  - `Trophy` stays for winners;
  - `UserX` is new, for "No está · sortear otro";
  - `ListOrdered` is new, for the ranking.
- **The category select** follows the form's existing `SelectField`. Copy is in Spanish, neutral: "Categoría", not "Sexo".

## Mobile

- **At 390 px:**
  - the raffle options stack one per row;
  - "No está · sortear otro" is a 44 px button under each winner's name;
  - "Siguiente ganador" is full width, so it is easy to hit while holding the phone up.
- The ranking is a plain ordered list, with no table and no horizontal scroll.
- **Registration** gains one select; the form stays a single column at 390 px.
- **No new dependency.**

## Security and data

- The new functions are `security definer` with `set search_path = ''`. `execute` is granted to `service_role` only, since they are called from `admin-pin`. Anon gets nothing.
- `eligibleCount`, `winners`, `redraw` and `ranking` require the `admin` role, like `draw`. The guard already covers every `dynamicData` operation.
- **Category is personal data.** It is only shown inside the admin, never on the home page or in the pass. It is optional in practice, through "Prefiero no decir".
- **Remote rollout:** each migration gets a `begin … rollback` dry run, then is applied. Then `admin-pin` is deployed. Iván runs both, as before.

## Out of scope

- Age categories.
- Showing points or the ranking to runners.
- Scheduled draws (`draw_at`), and `starts_at` / `ends_at`.
- Dropping the legacy `raffles` / `raffle_entries` tables.
