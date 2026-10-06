# Delete draft dynamics — plan

Spec: [`2026-10-05-delete-draft-dynamics-design.md`](../specs/2026-10-05-delete-draft-dynamics-design.md) · Branch: `feat/delete-draft-dynamics` · **Approved by Iván, 2026-10-05.** Needs an `admin-pin` deploy.

## Tasks

### 1. `feat(edge): delete all draft dynamics`

- **`supabase/functions/admin-pin/index.ts`:** the `deleteDrafts` operation in `dynamicData`: `delete().eq('event_id', event.id).eq('status', 'draft').select('id')`, answering `{ ok: true, deleted }`.
- **`features/admin/types.ts`:** `deleted?: number` on `AdminResponse`.
- **Check:** `pnpm lint`; `deno check` on the function is blocked by the unrelated `openai` types, so the check is a careful review plus Task 3's live probe.

### 2. `feat(admin): delete drafts button`

- **`features/admin/dynamics/use-dynamics.ts`:**
  - the confirmation also accepts `{ action: 'deleteDrafts', drafts: DynamicRow[] }`;
  - `confirm()` calls `deleteDrafts`, then shows "N borradores eliminados." and reloads.
- **`features/admin/dynamics/dynamics-view.tsx`:**
  - the "Eliminar borradores (N)" button under the list, only when N > 0 and with no filter hiding drafts (the count is taken from all rows, not the filtered ones);
  - its `ConfirmPanel` with the names.
- **`CHANGELOG.md`:** Added: "**Delete all draft dynamics** in one step from the Dinámicas panel."
- **Checks:**
  - **390×844 first** (Playwright, mocked `dynamicData`): button hidden with no drafts, the button, the confirmation with names, feedback after; then 1440;
  - the op sent is `deleteDrafts` with no ids;
  - `pnpm ci:check`.

### 3. Deploy (Iván)

```bash
supabase functions deploy admin-pin --project-ref ohatsnkgaeccltqwhkbv
```

- **Check:** in the deployed panel, the button deletes only drafts. Active dynamics stay.

### 4. `chore(release): 0.6.0`

- Bump `package.json` and cut `## [0.6.0] - YYYY-MM-DD` in `CHANGELOG.md`.

## Done when

- `pnpm ci:check` passes.
- The 390 and 1440 screenshots are reviewed.
- The branch stays local until Iván says to push it.
