# Plan — Landak Studio Home section

Spec: `docs/superpowers/specs/2026-10-07-landak-studio-section-design.md`

Branch: `feat/landak-studio-section`

Status: **approved by user request on 2026-10-07**.

Release: `0.25.0`.

## 1. Database section key

- Extend the `home_section_order_key_check` constraint with `landak_studio`.
- Insert a visible SR26 row at the end of the current order.
- Verify stored row and security advisors.
- Commit matching migration SQL.

## 2. Home section registry

Files:
- `features/home/section-order.ts`
- `features/home/section-order.test.ts`
- `app/page.tsx`

Changes:
- add `landak_studio` to the type, defaults and admin metadata;
- render the new section when visible;
- keep it unnumbered editorially.

## 3. Landak section UI

Files:
- `features/home/sections/landak-studio.tsx`
- `app/home-v2.css`

Changes:
- add a dark creative-partner section;
- use text-based Landak branding, attribution copy, service line and external CTA;
- responsive centered mobile layout.

## 4. Admin save support

File:
- `supabase/functions/admin-pin/index.ts`

Changes:
- allow `landak_studio` in `HOME_SECTION_KEYS`;
- deploy the updated edge function.

## 5. Release

Files:
- `package.json`
- `CHANGELOG.md`

Changes:
- bump to `0.25.0`;
- document the new configurable Landak Studio section.

## Final checks

- CI fully green;
- SQL tests green;
- Vercel preview READY;
- section visible and linked to `https://landak.pro/`;
- no production deploy until explicitly requested.
