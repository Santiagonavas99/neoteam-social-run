# Registration form fixes — spec

Date: 2026-10-05 · Branch: `fix/registration-form` (from `main` at 0.3.0) · Status: **approved 2026-10-05**

Source: Santiago's commits `7867a32` and `11201f5` on `feat/qr-wallet-checkin`. They are ported here, not merged, because that branch predates `features/`.

## Problem

Two bugs on `/registro`, the page that brings in participants:

1. **The form empties itself after a server error.**
   - React 19 resets a `<form action>` after every submission.
   - When the server returns "Hay algunos datos por revisar." or "Ya existe una inscripción…", every field comes back blank, including the dates and the checkboxes.
   - On a phone, that means typing 11 fields again, which is the most likely moment for someone to give up.
2. **Phone numbers are barely validated.**
   - `phone` and `emergencyPhone` accept any 7 to 30 characters, so "123 abc 4567" passes.
   - Staff call or message these numbers on WhatsApp.

## Decisions

1. **The action returns what was submitted, and the inputs use it as `defaultValue`.**
   - `registerParticipant` adds `values` to every failed `RegistrationState`.
   - `values` holds the submitted strings and checkbox flags from the `FormData`.
   - Each input uses `defaultValue={state.values?.x}`, or `defaultChecked` for checkboxes. React's reset then restores the submitted values instead of blanks.
   - This is the pattern Next documents for server actions. The fields stay uncontrolled, so there are no extra `useState`s.
   - **Rejected:** Santiago's version, which made all 14 fields controlled (`useState` and `onChange` on each). It is about 90 more lines and re-renders the whole form on every keystroke.
2. **Phones are normalized, then must be exactly 10 digits.**
   - `schema.ts` strips everything that is not a digit.
   - It then drops a leading `57` when 12 digits remain.
   - It then requires `^\d{10}$`, with the error "Escribe un número de 10 dígitos, sin +57.".
   - The normalized number is what gets saved.
   - Why the normalization matters:
     - phone autofill on iOS and Android fills `+57 300 123 4567`;
     - Santiago's client-side `onlyDigits(...).slice(0, 10)` would turn that into `5730012345`, which is wrong and still passes the check.
   - Any 10 digits are accepted, not only numbers starting with 3: an emergency contact may be a landline (`601…`, also 10 digits).
3. **Inputs help the phone keyboard.** Both phone inputs keep `type="tel"` and get `inputMode="tel"` and `autoComplete="tel"`.
   - There is no `maxLength` and no `pattern`, so autofill with `+57` is not cut off. The server does the check.

**Out of scope:**
- the QR pass shown after registration (spec `2026-10-05-qr-checkin-design.md`);
- any database change: existing registrations keep their phone numbers as they are.

## Security

- `values` only echoes what the same user just typed back to them; no data from the database.
- Validation stays on the server.

## Mobile

- At **390 px**, after a failed submit:
  - every field keeps its value;
  - the selects and checkboxes are restored.
- **Cost:** no new client JavaScript and no new dependency.
