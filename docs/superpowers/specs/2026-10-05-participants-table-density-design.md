# Participant table density and state control — spec

Date: 2026-10-05 · Branch: `feat/participants-table-polish` · Status: **approved 2026-10-06**

## Problem

PR #15 already groups each participant into three columns and removes horizontal scrolling, but the current desktop result still feels oversized and visually disconnected:

- each row uses more vertical space than the amount of information requires;
- participant, registration and status content float in wide empty areas instead of reading as one record;
- the state selector looks like a large standalone pill, while the status dot sits too close to its top edge and the delete action feels appended;
- headings and secondary data are too faint at a glance;
- the table needs to remain useful for staff on a 390 px phone without turning back into a horizontally scrolling grid.

The screenshot supplied by the owner is the visual baseline for this pass. Existing participant operations, API contracts and stored values remain unchanged.

## Decision

Keep the three information groups introduced in PR #15, but tighten them into a compact operational list:

1. **Participant** remains the dominant column. Avatar, name, document, phone and email form one left-aligned identity block. The phone stays directly below the document, as requested.
2. **Registration** keeps the code as the primary datum, with group and shirt size on one quieter metadata line.
3. **Status and actions** become one aligned control cluster. The state dot moves inside the selector, vertically centered beside the label; the chevron remains at the far edge. The delete button stays separate so a destructive action cannot be confused with a state.
4. Desktop rows use a denser rhythm and clearer column proportions. Subtle row hover/focus feedback may help scanning, but no decorative animation is added.
5. The summary remains above the list but becomes visually quieter than the records. It must wrap rather than require horizontal scrolling.
6. Existing Host Grotesk typography and design tokens are reused. No new dependency, raw icon family or palette is introduced.

The signature of this admin surface is the participant identity block: initials, real-world identity data and registration metadata read as a compact event roster rather than a generic data table.

## Interaction and accessibility

- The native `select` remains the interaction underneath the styled status control.
- Every state and delete control keeps an accessible name containing the participant's name.
- Controls are at least 44 × 44 px on mobile; visible `:focus-visible`/`:focus-within` feedback is retained.
- Changing a state continues to call the existing attendance action and show the existing saving feedback.
- Delete continues to open the existing confirmation panel; it is not made a one-click destructive action.
- The row must not rely on hover to expose information or actions.

## Mobile

At 390 px, each participant is a single card with this order: identity, registration metadata, then a full-width state/action row. The card has no horizontal overflow, email values can truncate safely, and the state selector plus delete action remain reachable with one hand. Summary stats wrap into a compact grid/list rather than a horizontal scroller.

At 1024 and 1440 px, the semantic table remains visible with three columns and denser rows. Content should fit the admin content area without page-level or table-level horizontal scrolling.

## Security and data constraints

- No changes to the admin PIN, session flow, API routes, Edge Functions, Supabase schema or participant data model.
- No participant value is interpolated into unsafe HTML.
- No real participant screenshot is committed to the repository.

## Alternatives rejected

- **Return to seven columns:** restores the horizontal-scroll problem and fragments related information.
- **Put delete inside the status menu:** mixes a destructive record action with attendance state and increases accidental deletion risk.
- **Use only colored badges with separate action buttons:** adds more controls per row and makes routine state changes slower.
- **Replace the table with desktop cards:** reduces scanability when staff manage many participants.

## Out of scope

Search/filter behavior, pagination, bulk actions, participant editing, export, status definitions, backend behavior, other admin sections and the public site.
