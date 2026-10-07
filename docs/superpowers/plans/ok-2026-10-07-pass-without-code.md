# Open the pass with document and email — plan

Spec: [`2026-10-07-pass-without-code-design.md`](../specs/2026-10-07-pass-without-code-design.md)

- **Branch:** `feat/pass-without-code`, cut from `main` (0.12.0).
- **Release:** `0.13.0` (task 3).
  - It is a `feat` commit, so it bumps the minor version.
  - It merges before `feat/home-numbers`, which moves to 0.14.0.
- **Deploy order:**
  1. `supabase functions deploy registration-pass --project-ref ohatsnkgaeccltqwhkbv`;
  2. merge the PR.
  - **No downtime:** `requestCode` stays as a stub that answers `{ ok: true }` without sending anything, and `claim` ignores an `otp`. So the old web (data, then code, then claim) still opens the pass while it lives. The stub goes in the cleanup that drops `pass_email_codes`.

Status: **approved** (Iván, 2026-10-07).

## 1. `feat(pass): open the pass with document and email`

- **`supabase/functions/registration-pass/index.ts`:**
  - `claim` without `otp`: `findRegistration`, then `passBody`, or the generic 404;
  - `requestCode` becomes a stub (`{ ok: true }`, no email);
  - the unused OTP imports are removed.
- **`features/registration/pass.ts`:** `claimPass({ documentNumber, email })`; `requestPassCode` is removed.
- **`features/registration/claim-actions.ts` and `claim-form.tsx`:** one step. `CodeField` is used here no longer, but it stays for the admin.
- **Checks:**
  - `pnpm ci:check`;
  - at 390 px against the mock:
    - right data shows the pass;
    - wrong data shows the generic message;
    - there is no code field.

## 2. `docs: pass without code`

- **`CLAUDE.md`:** the registration path says `/pase` takes document and email.
- **`docs/email-setup.md`:**
  - the final test drops the `/pase` code step;
  - the limits note drops "cada código de `/pase`";
  - a deploy note for 0.13.0.

## 3. `chore(release): 0.13.0`

- `package.json` goes to 0.13.0.
- The CHANGELOG section `[0.13.0] - <date>`, Changed: "/pase opens with document and email again, without a code."
