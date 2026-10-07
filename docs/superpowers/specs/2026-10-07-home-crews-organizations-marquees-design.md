# Home marquees for running crews and organizations — spec

Date: 2026-10-07 · Branch: `feat/home-crews-organizations-marquees` (from `main`) · Status: **original marquee scope approved; allied-logo reuse extension awaiting approval**

Design reference: the existing “Marcas aliadas” logo marquee on the public Home and the supplied screenshot.

## Problem

The public Home has a dedicated logo marquee for allied brands. Running crews and event organizations also need separate marquees. The user clarified that allied brand entries already configured in the admin should be reusable in either community strip, while additional crew-only and organization-only entries remain manageable in their existing admin sections.

## Decisions

1. Keep the three separate strips: “Marcas aliadas”, “Running crews”, and “Organizaciones”, with the same card treatment, marquee motion, pause behavior, links, and reduced-motion fallback.
2. Native crews continue to come from `running_groups`; native organizations continue to come from `brands` where `type = 'organizer'`. Their existing active, home visibility, ordering, and logo controls remain available.
3. Add two independent inclusion flags to existing allied logo carousel items. From “Marcas aliadas” admin, an entry can be included in the Running crews strip, Organizations strip, both, or neither.
4. Reuse the allied entry's existing logo, name, and link details. Require its existing active and show-on-home settings as well as the relevant inclusion flag for it to appear in a community strip.
5. Extra crew-only entries remain creatable in “Running crews”; extra organization-only entries remain creatable in “Marcas” with type “Organizador”. Those records do not become allied brands.
6. Merge sources server-side, preserve deterministic ordering, and deduplicate a reused ally against a matching native record within each strip, preferring the native record's tile when matched.
7. Keep sponsors and partners in the lower community content; crews and organizers are removed from those lower panels to avoid repeating the same presentation.
8. If a visible crew or organization has no uploaded logo, render a readable name tile.

## Design and security constraints

- Follow `DESIGN.md`: mobile first at 390 px, existing theme tokens, visible focus, ≥44 px touch targets, and `prefers-reduced-motion`.
- Keep the existing white logo tiles on the dark surface, matching the approved logo strip design.
- The browser must not query Supabase directly. Home reads remain server-side; admin writes remain behind `/api/admin` and the existing Edge Function.
- Schema changes are limited to the two inclusion flags on the existing allied logo carousel table; do not add new tables or public write privileges.

## Out of scope

Changing the existing crew and organization models, duplicating logos or records to reuse an ally, new admin sections, auth changes, registration/event behavior, metrics, or production deployment.

## Plan

The requested extension's files, migration, checks, and release steps are listed in [`2026-10-07-home-marquee-reuse.md`](../plans/2026-10-07-home-marquee-reuse.md).
