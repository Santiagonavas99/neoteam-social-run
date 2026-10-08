# Admin participants pagination — design spec

Date: 2026-10-07 · Branch: `feat/admin-participants-pagination`

## Problem

The Participantes screen currently loads every registration in one request and renders the full result set in the browser.

That is acceptable with a handful of registrations, but the event expects roughly 100–150 people. At that size:
- the initial admin payload grows unnecessarily;
- the browser filters a large array on every search/status change;
- the DOM may contain 100+ expandable participant rows;
- mobile scrolling becomes long and harder to recover from after editing a participant.

A client-only paginator would hide rows but would not solve the payload, filtering or DOM cost.

## Decision

Paginate Participantes on the server, 25 participants per page.

The participant list endpoint becomes responsible for:
- page;
- page size;
- search query;
- status filter;
- exact total count;
- global status counts.

The browser only renders the current page.

### Page size

Fixed at **25** for this release.

With 100–150 attendees this means roughly 4–6 pages, which is enough to make the screen lighter without adding a page-size selector that staff does not need on event day.

### Search

Search remains a single field and searches the **whole event**, not just the current page.

It matches the same useful participant fields as today where practical:
- first name;
- last name;
- email;
- phone;
- document number;
- registration code;
- crew / free-text crew.

Search is debounced briefly in the browser before requesting page 1.

Changing the search resets to page 1.

### Status filters

The existing status chips remain.

Counts are calculated over the whole SR26 event, independent of the current page:
- Todos;
- Inscrito;
- Check-in;
- No asistió;
- Cancelado.

Selecting a status resets to page 1 and requests only that status from the server.

### Pagination UI

Below the participant list:

**Mobile (390 px):**
- Anterior;
- `Página 2 de 6`;
- Siguiente.

The controls are one compact row, ≥44 px touch targets, with Previous/Next disabled at the ends.

**Desktop:**
Keep the same simple controls instead of adding a dense numbered paginator; 4–6 pages do not justify a large page-number strip.

Above the list, replace the current local count with:
- `Mostrando 26–50 de 147 participantes`;
- for a search/filter, the total reflects that filtered result set.

## Participant mutations

Check-in, resend, status change and delete remain available on the current row.

After a mutation:
- save/status changes update or reload the current page;
- delete reloads the current page;
- if deletion empties the last page, move to the previous valid page.

No optimistic row from another page is required.

## Backup CSV

“Descargar lista” must still mean **every registration**, regardless of:
- current page;
- search;
- status filter.

It must not reuse the paginated page rows.

When clicked, the admin requests a dedicated full backup dataset and builds the existing CSV from that result. Loading all 100–150 records is acceptable for this explicit, infrequent action.

## Backend response

The participants list response adds pagination metadata:

```ts
{
  rows: Participant[]
  count: number
  page: number
  pageSize: number
  statusCounts: {
    registered: number
    checked_in: number
    no_show: number
    cancelled: number
  }
}
```

The generic response type may gain these optional fields, but other admin resources keep their current behavior.

## Backend query

`admin-pin` special-cases `participants + list` before the generic resource list:

1. resolve SR26 event;
2. validate/clamp `page` and fixed `pageSize`;
3. apply event scope;
4. apply optional status;
5. apply safe search;
6. request exact count;
7. order newest first;
8. apply Supabase `.range(from, to)`;
9. obtain status counts for SR26.

All values remain server controlled; no table or column names come from the browser.

## Search implementation constraint

Crew name lives in a related row. If PostgREST cannot safely combine the related-name search with the existing participant select in one query, use a two-step server-side strategy:
- find matching running group IDs by crew name;
- include those IDs in the registration filter.

Do not fall back to loading all participants into the Edge Function and filtering there.

## Mobile

Primary target: 390 px.

Requirements:
- only 25 expandable rows max in the DOM;
- paginator visible directly after the list;
- no horizontal scroll;
- filter chips retain horizontal swipe;
- changing filters/search returns to page 1;
- touch targets ≥44 px;
- loading a new page does not append rows to the old page.

## Accessibility

- paginator uses a `nav aria-label="Paginación de participantes"`;
- current page is announced in text;
- disabled buttons use native `disabled`;
- loading state remains exposed through `aria-busy`;
- search label remains unchanged.

## Performance

No dependency changes.

The normal participant screen transfers max 25 participants instead of all registrations.

The full dataset is requested only when staff explicitly downloads the backup CSV.

## Security

No browser-to-Supabase access is introduced.

All reads remain:
`/api/admin` → authenticated admin Edge Function → Supabase service role.

Search strings are passed as filter values only; table/column identifiers remain hard-coded server-side.

## Alternatives rejected

- **Client-only pagination:** still downloads and filters every participant.
- **Infinite scroll:** worse for finding a known runner and awkward after row edits.
- **50 rows per page:** unnecessarily large for phone use.
- **10 rows per page:** too many page changes for 100–150 attendees.
- **Numbered 1–6 paginator:** adds visual noise without improving navigation enough over Previous/Next.

## Out of scope

- Sorting controls.
- Configurable page size.
- URL-synced admin page/query state.
- Infinite scrolling.
- Pagination of Groups, Brands, Logos or Dynamics.


## Deployment compatibility

The new paginated list is explicitly opt-in with `paginated: true`.

This keeps the current production admin compatible while the updated Edge Function is deployed for preview testing:
- old production client without the flag continues receiving the legacy full participant list;
- new preview client receives paginated data;
- once the frontend release is merged, the legacy path remains harmless backward compatibility.
