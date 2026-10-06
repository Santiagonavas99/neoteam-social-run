# Registration form fixes — plan

Spec: [`2026-10-05-registration-form-fixes-design.md`](../specs/2026-10-05-registration-form-fixes-design.md) · Branch: `fix/registration-form` · Order: **1 of 5** (ship first: it affects people registering today)

## Tasks

### 1. `fix(registration): require 10-digit phone numbers`

- **`features/registration/schema.ts`:**
  - add a `phoneSchema`: `z.string().transform(digits only, drop a leading 57 when 12 digits remain).pipe(z.string().regex(/^\d{10}$/, 'Escribe un número de 10 dígitos, sin +57.'))`;
  - use it for `phone` and `emergencyPhone`.
- **`features/registration/schema.test.ts`:**
  - accepts `3001234567` and `6011234567`;
  - normalizes `+57 300 123 4567` and `300-123-4567` to `3001234567`;
  - rejects `300123456` (9 digits), `30012345678` (11 digits) and `abc`.
- **Check:** `pnpm test`.

### 2. `fix(registration): keep values after a failed submit`

- **`features/registration/actions.ts`:**
  - add `values?: Record<string, string>` to `RegistrationState`;
  - return `values` from every `ok: false` branch (validation, duplicate, unexpected error), built from `formData` (text fields; checkboxes as `'on'` or absent).
- **`features/registration/registration-form.tsx`:**
  - `defaultValue={state.values?.<field>}` on every input and select;
  - `defaultChecked={state.values?.<checkbox> === 'on'}` on the three checkboxes;
  - `runningGroup` keeps its `useState`, now seeded from `state.values` after an error;
  - phone inputs: `inputMode="tel"`, plus `autoComplete="tel"` on the participant's phone.
  - **If** the select or the checkboxes do not restore after React's reset, add `key={submissionCount}` to the `<form>` so it remounts with the new defaults. Note it in the PR.
- **`CHANGELOG.md` (`[Unreleased]`, Fixed):**
  - "El formulario de inscripción conserva lo que escribiste cuando hay un error.";
  - "Los celulares deben tener 10 dígitos; si el teléfono los autocompleta con +57, se corrige solo.".
- **Checks, at 390×844 first (Playwright on `pnpm start`), then 1440:**
  - submit with an invalid email: every other field, the document type, the running group ("otro" with its name) and the checkboxes keep their values;
  - submit a duplicate (mock the action's RPC error, or use a document already registered in a test run against preview): values kept, message shown;
  - autofill-style input `+57 300 123 4567` is saved as `3001234567`.
- **Check:** `pnpm ci:check`.

## Done when

- `pnpm ci:check` passes.
- The 390 and 1440 screenshots of the error state are reviewed.
- The branch stays local until Iván says to push it.
