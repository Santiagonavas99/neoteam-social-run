# Open the pass with document and email — spec

Date: 2026-10-07 · Branch: `feat/pass-without-code` · Status: **approved** (Iván, 2026-10-07)

## Problem

Iván, 2026-10-07: "para ver el pase basta con el correo y la cédula, no es necesaria la validación de OTP en ese paso".

Since 0.10.0, `/pase` takes two steps: document and email, then a 6-digit code sent by email. That is friction at the worst moment, at the gate, when the runner has lost the screenshot. Every lookup also spends one email from the free plan's 100 a day.

## Decision

1. **`/pase` goes back to one step:** document and email, then the pass.
   - `claim-form.tsx` and `claim-actions.ts` lose the code step, the resend countdown and `intent=resend`.
   - The wrong-data message stays generic: "No encontramos una inscripción con ese documento y correo".
2. **`registration-pass`:**
   - `claim` checks only the document and the email (`findRegistration`);
   - `requestCode` stops sending anything and answers `{ ok: true }`, so the old web keeps working during the deploy. It is removed in the later cleanup;
   - its imports from `_shared/otp.ts` and `codeEmail(…, 'pass')` go.
   - `registered`, which emails the pass after registering, and `pass`, used by Wallet, stay as they are.
3. **Kept unused for now:** the `pass_email_codes` table and the `'pass'` purpose of `codeEmail`. Dropping the table needs a migration and can come in a later cleanup. `_shared/otp.ts` stays, because the admin sign-in uses it.

## Trade-off Iván accepts

Anyone who knows a runner's document number and email can open that runner's pass, and so their check-in QR. That was the situation before 0.10.0.

**Mitigations already in place:**
- the answer never says which of the two fields is wrong;
- a pass can only be checked in once: the second scan shows "Ya hizo check-in", so a copied QR is caught at the gate;
- the runner also has the pass in their email.

## Alternatives rejected

- **Keep the code, but only when the email was not delivered:** two paths to explain and test, for little gain.
- **Ask for the registration code (`SR26-xxxxx`) as well:** the runners who need `/pase` are exactly those who lost it.

## Mobile

- At 390 px it is one form with two fields (`inputmode="numeric"` for the document, `type="email"` with `autocomplete="email"`) and one 48 px button.
- The pass appears below it, without a second screen.

## Out of scope

- Dropping `pass_email_codes`.
- Rate limiting `/pase` per IP. The proxy does not forward the IP to `registration-pass` today; it can be added if abuse shows up.
