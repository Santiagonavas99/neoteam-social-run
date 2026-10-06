# Delete draft dynamics — spec

Date: 2026-10-05 · Branch: `feat/delete-draft-dynamics` · Status: **awaiting OK**

## Problem

Drafts pile up in Dinámicas: test runs, raffles copied from the old Rifas screen, ideas that were never opened. Deleting them one by one means opening each editor and confirming each time. Iván asked for one button that deletes all of them.

## Decision

1. **A new `dynamicData` operation, `deleteDrafts`,** in `admin-pin`:
   - it deletes every dynamic of the SR26 event with `status = 'draft'`, in a single `delete … returning id`, and answers `{ ok: true, deleted: <count> }`;
   - it is behind the same session check and proxy secret as every admin action;
   - the server decides what a draft is. The client sends no list of ids, so a stale screen cannot delete a dynamic that was opened in the meantime.
2. **Cascades already in the schema do the rest:**
   - the dynamic's participations are deleted (`on delete cascade`);
   - a raffle that depended on a deleted draft loses that link (`on delete set null`) and draws among all eligible runners.
3. **The button:**
   - "Eliminar borradores (N)", with a `Trash2` icon, in the danger text style that the editor uses for "Eliminar";
   - it sits **under the list**, away from "Crear dinámica" and the scan buttons, so a stand phone does not tap it by mistake;
   - it is only shown when there is at least one draft, and is disabled while an editor, a scanner or another confirmation is open;
   - it opens the existing `ConfirmPanel` (`kind="delete"`): "¿Eliminar N borradores?", followed by the draft names, and "Se eliminarán junto con sus participaciones." The confirm button reads "Sí, eliminar borradores".
   - After deleting: the feedback "N borradores eliminados." and the list reloads.

**Rejected:**
- **Checkboxes to pick drafts:** more UI than the need. Single deletes already exist in each editor.
- **Deleting the legacy `raffles` rows behind the copied drafts:** the `raffles` table goes away in the edge-function split plan. The only risk is re-running `20261005233028_dynamics_mvp.sql`, which would copy those raffles again, and nobody re-runs it now that the remote is verified.

## Security

- Nothing new is exposed: same `/api/admin` → `admin-pin` path, same session.
- The delete is scoped by `event_id` and `status = 'draft'` on the server. Active, closed, completed and cancelled dynamics are never touched.

## Mobile

- At 390 px the button is full-width under the last card, at least 44 px tall.
- The confirmation scrolls into view (`useReveal`, already on `main`).

## Out of scope

- Bulk actions for other states.
- An undo.
