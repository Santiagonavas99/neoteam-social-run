# Activate a dynamic from its card — plan

Spec: `docs/superpowers/specs/2026-10-07-activate-dynamics-design.md` · Branch: `feat/activate-dynamics`

## Tasks

1. **`feat(admin): activate a draft dynamic from its card`**
   - `features/admin/dynamics/use-dynamics.ts`: `activate(row)` calls `dynamicData` `save` with `{ ...row, status: 'open' }`, shows "Dinámica activada." and reloads.
   - `features/admin/dynamics/dynamics-view.tsx`: "Activar" button (`Play`) on `draft` cards, disabled with `locked`.
   - `features/admin/dynamics/dynamic-form.tsx`: one-line hint under Estado.
   - `DESIGN.md`: `Play` row in the icon table.
   - Check: Playwright with the mocked admin at 390 px, then 1440: create a dynamic → Borrador → Activar → badge "Activa" and "Registrar participación" appears; a raffle shows "Sortear".
2. **`chore(release): 0.15.0`**: CHANGELOG `Added` entry and `package.json` bump.
   - Check: `pnpm ci:check` exit 0.

No Supabase deploy or migration.
