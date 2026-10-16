# Repeat dynamics and sponsor sources

Branch: feat/dynamics-repeat-allied-sponsors-20261015
Spec: ../specs/2026-10-15-repeat-dynamics-allied-sponsors-design.md
Scope directly requested by user for a feature PR.

1. Clone pure editable configuration into new draft; tests for untouched history.
2. Add Repeat actions to finished cards and results views; review/edit form before save.
3. Read allied logos via authorized admin endpoint and deduplicate with old brands; tests.
4. Keep server, schema, OTP, QR and registration code untouched.
5. Release notes and version bump.

Checks: 390px then desktop, keyboard, test suite, lint, typecheck and production build in CI.