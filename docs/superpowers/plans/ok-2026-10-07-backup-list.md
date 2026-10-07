# Offline backup list of registrations — plan

Spec: `docs/superpowers/specs/2026-10-07-backup-list-design.md` · Branch: `feat/backup-list`

## Tasks (one commit each)

1. **`feat(admin): build the backup list`**
   - New file `features/admin/participants/backup-list.ts`: `backupListCsv(rows, now)`, with its columns, sorting, quoting and formula guard.
   - New file `backup-list.test.ts`. The test covers:
     - sort by last name;
     - accents with the BOM;
     - `;`, `"` and line breaks quoted;
     - a value starting with `=` gets the `'`;
     - check-in time formatted;
     - cancelled rows included with their state;
     - the file name.
   - Check: `node --test` on the file.
2. **`feat(admin): Descargar lista button in Participantes`**
   - `participants-view.tsx`: the toolbar action, which triggers the download.
   - DESIGN.md: the `FileDown` row.
   - Check:
     - Playwright at 390 px, then 1440, with a mocked `adminData`: the button downloads a file with the expected name and content, regardless of the active filter;
     - the file opens with accents intact (read back as UTF-8 with BOM);
     - no horizontal scroll.
3. **`docs: event-day checklist`**: new file `docs/event-day.md` with the backup list routine, staff signing in the day before, batteries and the manual code.
4. **`chore(release): 0.24.0`**: CHANGELOG and `package.json`.
   - Check: `pnpm ci:check` exit 0.

No Supabase change.
