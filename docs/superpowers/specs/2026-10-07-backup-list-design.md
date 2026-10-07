# Offline backup list of registrations — spec

Date: 2026-10-07 · Branch: `feat/backup-list` · Status: **approved** (Iván, 2026-10-07: "dale caña")

## Problem

Iván, 2026-10-07, after asking whether the free backend holds 100+ check-ins with 4–5 staff: the backend holds them easily. The real risk is **the park's internet**: without a connection, check-in stops. He chose "la lista": a backup list staff can use on paper or on a laptop if the network drops, and enter later.

## Decision

1. **A "Descargar lista" button in Participantes** (admin only; the `checkin` role does not see this screen), in the list toolbar.
   - It downloads a CSV of **all** registrations of SR26, whatever filter or search is on screen, built in the browser from the rows the screen already loaded. No new server action.
   - The file is named `social-run-inscritos-AAAA-MM-DD-HHMM.csv`, with the download time, so several copies are not confused.
2. **Columns,** sorted by last name and then first name, which is how a person is found on paper:

   | Column | Content |
   |---|---|
   | Código | `SR26-00042` |
   | Apellidos | last name |
   | Nombres | first name |
   | Documento | type and number, for example `CC 1234567` |
   | Grupo | running group or "Independiente" |
   | Talla | shirt size or empty |
   | Estado | Inscrito, Check-in, No asistió or Cancelado |
   | Hora check-in | `7:42 a. m.` if already checked in, else empty |
   | Llegó | always empty, for ticking by hand |

3. **Format that opens right in Excel in Spanish and in Google Sheets:**
   - `;` separator;
   - UTF-8 with BOM, so accents and ñ show correctly;
   - fields quoted when needed (`"`, `;` or a line break inside).
   - Values starting with `=`, `+`, `-` or `@` get a leading `'`, so a name can never run as a spreadsheet formula (CSV injection).
4. **The pure logic** (sorting, escaping, columns) goes in `features/admin/participants/backup-list.ts`, with a test. The button only calls it and triggers the download (`Blob` + `URL.createObjectURL`).
5. **Using it on event day** is a checklist in `docs/event-day.md`:
   - download the list the night before and again in the morning, then print one copy or keep it on a laptop;
   - if the network drops, find the runner by last name or code, check their document and tick "Llegó";
   - when the network is back, enter the ticked ones in Participantes with the "Check-in" button they already have.

## Alternatives rejected

- **Offline check-in that syncs later** (service worker plus a queue): much more code and risk the week before the event, and conflicts when two devices tick the same runner.
- **A PDF:** a new dependency or server rendering. CSV prints from Excel or Sheets and can also be searched.
- **Importing the ticked list back:** about 20 manual entries in the worst case is faster and safer than a new import path.

## Security

- **The file carries personal data** (names and document numbers), so it is admin only, like the screen. It excludes email, phone, birth date and emergency contacts: only what is needed to identify someone at the gate.
- **Nothing new on the server:** it uses the rows the admin already reads.
- **The checklist says** to delete the downloaded and printed copies after the event (data minimization).

## Design constraints

- **Icon:** `FileDown`, a new row in the DESIGN.md icon table: "download the backup list".
- **The button** uses the toolbar's secondary style, with a 44 px target, and is disabled while loading or with no rows.

## Mobile

- **At 390 px** the button fits in the Participantes toolbar without horizontal scroll, and on a phone the file goes to Downloads or Files. In practice it will be downloaded on a laptop to print it.

## Out of scope

- Offline check-in.
- Importing a ticked list.
