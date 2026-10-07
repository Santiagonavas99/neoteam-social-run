# Event day checklist — Social Run, 18 Oct 2026

For the staff running check-in and the dynamics. The backend handles hundreds of check-ins from several phones at once; what can fail is the park's network, a battery, or a sign-in left for the last minute.

## The day before (17 Oct)

- [ ] **Every staff member signs in to `/admin` on the phone they will use.** The session lasts 30 days, so nobody waits for an emailed code at the park. Use `www.socialrun.site`, not a preview link.
- [ ] **An admin downloads the backup list:** Participantes → **Descargar lista**. Check that it opens in Excel or Google Sheets with accents intact.
- [ ] Charge phones and power banks.
- [ ] No deploys from now until the event ends. A deploy can leave open pages pointing at an old version; if one is unavoidable, everyone reloads `/admin`.

## Morning of the event

- [ ] Download the list again (the file name carries the time, e.g. `social-run-inscritos-2026-10-18-0600.csv`) and **print one copy**, or keep it open on a laptop.
- [ ] Each check-in phone opens Check-in and scans one test QR, so the camera permission and the server are warm.
- [ ] Turn the volume up: a rising "check" means done, two beeps mean "ya hizo check-in", a low buzz means error. iPhones do not vibrate and are silent with the silent switch on.

## At the gate

- **Normal flow:** scan the QR. If the camera does not read it, type the code (`SR26-xxxxx`) in "Código manual".
- **Amber "YA HIZO CHECK-IN":** that pass was already used; check the name and time against the person.
- **"Inscripción cancelada":** send them to an admin.
- **No network:**
  1. Find the runner on the printed list by last name or code.
  2. Check their document.
  3. Tick **Llegó** and write the time.
  4. Keep going; nothing is lost.
- **Network back:** an admin enters every ticked runner in Participantes with **Check-in**. Do it before the raffles: raffles that require check-in only include runners checked in in the system.

## After the event

- [ ] Delete the downloaded files and shred printed copies: they contain names and document numbers.
