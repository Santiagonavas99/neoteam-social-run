# Participantes: filters, readable list and safe data corrections — design spec

Date: 2026-10-08 · Branch: `feat/admin-participants-filters-edit-20261008`

## Context and problem
The existing NeoTeam SR26 admin has global search, status chips, server-side paging (25 rows), a CSV backup, check-in, pass resend and destructive delete. The view shown by the organizer makes it hard to find members of a specific crew, distinguish people needing their first pass, or correct typos from signup. Admin currently only allows modifying attendance state.

## Design direction
Retain NeoTeam's Host Grotesk, cyan accent, dark/light theme tokens, existing admin navigation and 390px-first responsive behavior. The design is an operational register, not a generic spreadsheet: one concise identity row with a readable name, registration code, running crew, email and status; expandable details with grouped information and explicit actions. Preserve 25-row paging and status chips. No new CSS tokens/dependencies.

### Search and filters
- Search across the whole SR26 event (existing safe token match for name, code, email, document, phone and crew).
- Add selects for running crew (from existing database, including unassigned/independent and custom groups), email pass status (sent/pending), gender and order (newest/oldest/name A-Z). Keep existing status chips.
- Every filter is server-side, composable and resets to page 1. The filtered count reflects **all matches**, not the 25 displayed. Global status chips retain global totals.
- All column names and sort directions are whitelisted by the server. Avoid loading all participants to filter on the client.
- One «Limpiar filtros» control. The unfiltered «Descargar lista» CSV keeps its current semantics.

### Editing participant details
- Edit panel opens from an expanded participant card. Primary actions «Editar datos», «Guardar cambios», «Cancelar» and clear validation errors. Never autosave.
- Editable fields: first/last names; document type/number; email; phone; date of birth; gender; running group selection or custom group; shirt size; emergency contact name and phone.
- Only existing **admin** users can write via `/api/admin` → authenticated `admin-pin` Edge Function. Preserve existing `save` action for attendance and all check-in/scanner behaviors.
- Preserve registration ID, registration code/number, checkin token, status, terms/privacy consent, event ID and created_at. Do not edit pass QR.
- Validate names, document formats by type, valid email/domain, ten-digit Colombian phone, real birth date 1900–today, allowed gender/size and group belonging to the active crew list. Follow public form rules where possible.
- Database constraints guarantee unique email and unique document within event; translate violation into clear 409 errors without exposing others' details. Ensure event scope on every update and guard against concurrent edits using `updated_at` (return 409 instead of overwriting another admin's changes).
- When email changes, unset `pass_emailed_at` so the corrected address becomes visible in «Correos pendientes». Never send email automatically, and explicitly warn that the original address may already have received a pass. Other edits must not mark a pass as pending.
- Last-update feedback identifies that a change was saved. Administrative edits should be traceable by account and timestamp without exposing duplicate copies of private fields.

### Layout and mobile
- 390px: filters stack into two columns or full-width where necessary; list remains a vertical stack with 44px minimum taps; inline editing uses one-column fields and a sticky/visible action footer only if it never overlaps the bottom navigation. Focus goes to the first field when editing, and back to the edit button after cancel.
- 1440px: filters on a horizontal band where space allows; expanded edit fields use two columns. Never hide essential actions behind hover.
- Check accessibility, keyboard flow, long names/emails, busy states and errors. No misleading green success before server confirmation.

### Failure and security
- Do not alter production registrations during testing. Preview requires compatible backend before enabling editing; old frontend remains compatible.
- No public access to personal data or logs containing names, emails, documents/phone. Exclude canceled only when explicitly filtered; they remain visible under «Todos».
- Keep status edits, check-in, pass resend, delete confirmation and complete CSV backup working.
- Add unit tests for input validation, filters, concurrent-write and duplicate handling; SQL tests if an audit migration is introduced.

## Alternatives rejected
- Client-only filtering (the current page is just 25 rows).
- Editing directly in the list without Save/Cancel (accidental PII updates on mobile).
- Auto-resent passes upon email change (Resend quota and unexpected messages).
- Editing internal identifiers or consent flags (breaks QR and legal records).
- Overwriting someone else's newer changes silently.

## Release and deployment
A minor feature release (next available is 0.31.0). Spec and plan require organizer approval before code is implemented. No production database/Edge deployment or `main` merge without separate instruction.
