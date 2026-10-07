# Home marquees for running crews and organizations — spec

Date: 2026-10-07 · Branch: `feat/home-crews-organizations-marquees` (from `main`) · Status: **approved** (user, 2026-10-07)

Design reference: the existing “Marcas aliadas” logo marquee on the public Home and the supplied screenshot.

## Problem

The public Home has a dedicated logo marquee for allied brands. Running crews and event organizations are managed in the admin, but do not get the same marquee presentation. The user wants each community to have a matching, separate horizontal logo strip, with membership and visibility controlled from `/admin`.

## Decisions

1. Add two strips alongside “Marcas aliadas”: “Running crews” and “Organizaciones”. Reuse the existing card treatment, marquee motion, pause behavior, links, and reduced-motion fallback.
2. Read crews from the existing `running_groups` rows and organizations from `brands` where `type = 'organizer'`. Preserve the current public filter (`active = true`, `show_on_home = true`) and `sort_order`.
3. Reuse the current admin editors. Crews are configured in “Running crews” and organizations are configured in “Marcas” by selecting “Organizador”; their existing logo upload, ordering, active, and “Mostrar en página” fields control the strips. Make these destinations explicit in the admin labels and help text.
4. Do not add tables, columns, migrations, endpoints, dependencies, or change registration/event behavior.
5. Keep the existing community content for sponsors and partners; remove crews and organizers from its lower carousel panels so they are not repeated after getting dedicated marquees.
6. If a visible crew or organization has no uploaded logo, render a readable name tile so the admin’s “Mostrar en página” setting remains truthful.

## Design and security constraints

- Follow `DESIGN.md`: mobile first at 390 px, existing theme tokens, visible focus, ≥44 px touch targets, and `prefers-reduced-motion`.
- Keep the existing white logo tiles on the dark surface, matching the approved logo strip design.
- The browser must not query Supabase directly. Home reads remain server-side; admin writes remain behind `/api/admin` and the existing Edge Function.
- No new Supabase privileges or schema changes.

## Out of scope

New organization or crew fields, dedicated admin sections, changes to sponsor/partner editing, registration, metrics, and production deployment.
