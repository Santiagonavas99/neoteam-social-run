# Activate a dynamic from its card — spec

Date: 2026-10-07 · Branch: `feat/activate-dynamics` · Status: **approved** (Iván, 2026-10-07)

## Problem

Iván, 2026-10-07: "aunque tenga usuarios en check-in siguen en borrador, ¿cómo podemos una vez guardada activarla?"

What the code does today:
- A new dynamic is created as `draft` (Borrador).
- The only way to change it is to open **Editar** and pick **Estado → Activa** in a select. Nothing on the card says so.
- Check-in never changes a dynamic's status, and it should not: check-in makes a **runner** eligible; a **dynamic** opens when staff decide.
- The server already enforces the cycle:
  - "Registrar participación" (scan) only works on `open` dynamics;
  - a raffle can only be drawn when `open` ("Activa el sorteo antes de ejecutarlo"), and the draw sets it to `completed`.

So the engine is finished; the missing piece is a visible way to activate.

## Decision

1. **An "Activar" button on every draft card** (`dynamics-view.tsx`), next to Editar.
   - One tap sets the status to `open`. No confirmation: it is reversible from Editar.
   - Then the card shows what an active dynamic shows today: "Registrar participación", or "Sortear" for a raffle.
   - Feedback: "Dinámica activada."
2. **No server change.** It reuses the existing `dynamicData` → `save` operation with the row as listed and `status: 'open'`; the list already returns every field `save` needs.
3. **`useDynamics` gains `activate(row)`**, with the same busy and error handling as `confirm`.
4. **Icon:** `Play` from `lucide-react`, added to the DESIGN.md icon table as "Activate a dynamic".
5. **The form hint** under Estado explains the cycle in one line: "Borrador no recibe participaciones; actívala para escanear o sortear."

## Alternatives rejected

- **Activating dynamics automatically when check-in opens or the first runner checks in:** staff lose control of when a stand or raffle starts, and a raffle could be drawn by mistake.
- **New dynamics created as Activa by default:** a half-configured raffle would be live at once.
- **A new `setStatus` server operation:** `save` already validates the status; one more operation is code with no new capability.
- **"Cerrar" and "Reabrir" buttons:** Editar covers them; add if event day shows the need.

## Design constraints

- Buttons use the existing `.button` class; 44 px targets; disabled while another action is busy, like Sortear.
- Status stays readable without color (`StatusBadge` already has label and icon).

## Mobile

- At 390 px the card's action row wraps: Editar and Activar side by side, each at least 44 px tall.
- No new client dependency (`Play` comes from `lucide-react`, already installed).

## Security

- Unchanged: `save` requires the `admin` role in `admin-pin`; `checkin` staff cannot activate.

## Out of scope

- Closing or reopening from the card.
- Automatic schedules (`draw_at`).
