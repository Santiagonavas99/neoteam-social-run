# Feature structure (DDD-lite) and component split — spec

Date: 2026-10-05 · Branch: `refactor/feature-structure` (from `main` at 0.2.0) · Status: **approved 2026-10-05**

## Problem

Iván asked (2026-10-05) to organize the project by domain before the next features land, and to split components that are too large or repeated.

**Today, code is grouped by technical type, not by what it does:**
- `lib/` mixes event data, registration rules, home loaders, the admin proxy and Supabase clients;
- `components/` mixes public home pieces with the countdown;
- the admin lives entirely in `app/admin/`.

`feat/qr-checkin` and `feat/dynamics-admin` (Santiago) would pile into the same folders.

**Measured problems:**

| File | Lines | Problem |
|------|------:|---------|
| `app/admin/admin-management.tsx` | 611 | One component renders five screens (overview, participants, groups, brands, raffles). Each one is chosen by nested `section === …` ternaries. |
| `app/admin/admin-dashboard.tsx` | 550 | Session, setup/login, sidebar, home-cards editor and change-PIN live in one component, with 17 `useState`s. |
| `app/admin/logo-carousel-admin.tsx` | 436 | Repeats the list, editor, upload and loading code of the records screens. |
| `app/admin/record-editor.tsx` | 296 | Two different forms (raffle vs group/brand) behind one `raffle ? … : …`. |
| `app/page.tsx` | 251 | Six home sections inline. |

**Duplications found:**
1. **Image upload:** the size check, `FileReader` → base64 and the `uploadAdminImage` call, plus the upload-field markup. Present in `record-editor.tsx` and `logo-carousel-admin.tsx`.
2. **List loading with the stale-response guard** (`requestId` ref): `admin-management.tsx` and `logo-carousel-admin.tsx`.
3. **Refresh button with spinner, loading state, empty state, record card** (`record-summary`), and **editor actions** (Save / Cancel / Delete): two to three copies each.
4. **Two admin API clients** (`callAdminApi`, `callLogoApi`) that differ only in the endpoint and in gzip.
5. **Two proxy routes** (`app/api/admin/route.ts`, `app/api/admin/logos/route.ts`), identical except for the function name and the error copy (49/50 lines).
6. **Error handling:** `error instanceof Error ? error.message : '…'` is written about 12 times.
7. **PIN validation** (length, match), repeated in setup, login and change-PIN.
8. **Navigation data** (label, description, icon) is split between `navigation` in the dashboard, `sectionIcons` in `admin-ui.tsx` and the quick-access list in management.
9. **`<option>` lists built from a label map**: 4 copies.
10. **The NEOTEAM brand link**: 3 copies.

**Dead code:**
- `getHomeFeatureCards` / `defaultHomeFeatureCards`: no caller.
- The admin "home" section (home-cards editor): not in the navigation, so it cannot be reached. Yet `listCards` still runs on every login, and the v2 home does not render those cards.
- `lib/supabase/browser.ts`: no caller. It also contradicts the rule that the browser never queries Supabase directly.

## Design review

- **No visual or behavior change.** Markup and legacy CSS class names move as they are, so the legacy CSS keeps matching. The only user-visible difference is that one network call fewer happens at admin login (`listCards`).
- `DESIGN.md` standing rules still apply to every moved component: tokens, lucide vocabulary, `aria-hidden` icons, `motion-safe`.
- `frontend-design` skill: does not apply; nothing is redesigned.
- **Event constraint:** the admin runs check-in and draws on 18 Oct. Every task is a pure move or extraction, is checked with the mocked admin screenshots at 390 and 1440 px, and passes `pnpm ci:check`.

## Decisions

### 1. Feature folders by bounded context (DDD-lite), in a new top-level `features/` folder

This needs Iván's approval (AGENTS.md: no new top-level folders without it). `app/` keeps **routing only**: `page.tsx`, `layout.tsx`, `route.ts` and CSS. Each page imports its feature.

```
app/                         routes only (thin)
features/
  event/                     the event itself: what, when, where
    event.ts                 eventConfig, agenda (was lib/event.ts)
    countdown.ts (+ .test)   pure domain logic
    event-countdown.tsx
  registration/              signing up participants
    schema.ts (+ .test)      Zod rules (was lib/registration-schema.ts)
    actions.ts               server action → RPC
    registration-form.tsx
  home/                      public landing content
    data.ts                  Supabase loaders with fallbacks (was lib/home-features.ts, minus dead code)
    community-carousel.tsx, logo-marquee.tsx
    sections/                hero, story, agenda, community, raffle, final
  admin/
    api.ts                   one client for /api/admin and /api/admin/logos
    sections.ts              the single navigation config (label, description, icon, quick-access detail)
    types.ts                 per-entity types: Participant, RunningGroup, Brand, Raffle, LogoItem, Metrics
    labels.ts                participantStates, raffleStates, brandTypes
    errors.ts                errorMessage(error, fallback)
    ui/                      admin building blocks (see decision 3)
    auth/                    session hook, setup/login screen, pin-field, pin.ts (+ .test)
    shell/                   sidebar + topbar + section header
    overview/                metrics + quick access
    participants/            table, attendance actions
    community/               groups and brands: list + form
    raffles/                 list + form + draw
    logos/                   logo carousel list + form
    security/                change-PIN form
components/                  shared across features: site-header, footer, horizontal-carousel, brand-link
lib/                         infrastructure only: supabase/ (server, config), admin-proxy.ts (+ .test)
```

**Rules:**
- A feature may import from `components/`, `lib/` and `features/event/`, which is the shared kernel (the date and place are used everywhere).
- Features do not import each other otherwise.
- Pure domain logic (`countdown`, `schema`, `pin`, `errors`) has no React and no I/O, and gets tests.
- Data access stays where the security boundaries already put it: server loaders (`home/data.ts`), the server action (`registration/actions.ts`) and the admin API client (`admin/api.ts`). Nothing new talks to Supabase.

### 2. One component per screen, state where it is used

- **`AdminDashboard` becomes `AdminApp`:**
  - it uses `useAdminSession()` (status, validate, login, setup, logout, token);
  - it renders either `AuthScreen` or `AdminShell` with the current section.
- **`ChangePinForm` and `AuthScreen` own their PIN fields.** The dashboard no longer holds 6 PIN `useState`s.
- **`AdminManagement` is split into four views:**
  - `OverviewView`;
  - `ParticipantsView`;
  - `CommunityView` (groups and brands, one component with a `resource` prop, because their list and form are the same);
  - `RafflesView`.
- **`RecordEditor` is split into `RaffleForm` and `CommunityForm`**, both inside one `EditorForm` frame (heading, fieldset, feedback, actions).
- **`LogoCarouselAdmin` reuses the same building blocks.** It keeps its own `LogoForm`, because its fields are different.

### 3. Shared admin building blocks (`features/admin/ui/`)

| Block | Replaces |
|-------|----------|
| `Feedback`, `StatusBadge`, `Logo` | `admin-ui.tsx`, as is |
| `RefreshButton` | 2 copies |
| `LoadingState` | 3 copies |
| `EmptyState` (icon, title, text, action) | 2 copies |
| `RecordCard` (logo, title, subtitle, meta, actions, expandable editor) | 2 copies |
| `EditorForm` (heading, fieldset, feedback, save, cancel and delete actions) | 3 copies |
| `ImageUploadField` + `readFileAsBase64` | 2 copies |
| `ConfirmPanel` | the delete and draw confirmation |
| `LabelOptions` (`<option>`s from a label map) | 4 copies |
| `useAdminList(load)` (rows, loading, reload, with the stale-response guard) | 2 copies |

They carry the exact markup and class names they replace, so the CSS keeps matching.

### 4. One proxy and one client

- `lib/admin-proxy.ts` gains `proxyToEdgeFunction(request, functionName, connectionError)`, with tests. Both routes become 5 lines each, and keep their own Spanish error copy.
- `features/admin/api.ts` exports `callAdmin(action, payload)` and `callLogos(action, payload)`, built on one `post(endpoint, …)`. Gzip stays only for `uploadAdminImage`.

### 5. Typed entities instead of one bag type

`AdminRow` today has 30 optional fields shared by four entities. The four entities become separate types:
- `Participant`;
- `RunningGroup`;
- `Brand`;
- `Raffle`.

Each view types its rows. The edge function's JSON is unchanged.

### 6. Delete dead code

- The home-cards editor and its `listCards` call at login.
- `getHomeFeatureCards`, `defaultHomeFeatureCards` and the `HomeFeatureCard` type.
- `lib/supabase/browser.ts`.

The edge function's `listCards`/`saveCards` actions stay. Removing them means a deploy, which belongs to the edge-function plan (see Out of scope).

### 7. Config follows the move

In the same commit as the move:
- `app/tailwind.css` gets `@source "../features";`. Without it, every utility in a moved file disappears.
- `biome.json` `files.includes` gets `features/**`.
- The `noAutofocus` override moves from `app/admin/**` to `features/admin/**`.
- `CLAUDE.md` and `AGENTS.md` get a "Where things live" row for `features/`.

**Rejected:**
- **Full hexagonal layers per context** (`domain/`, `application/`, `infrastructure/`, ports and adapters): the domain is small (CRUD plus a draw that already runs in a Postgres RPC). Ports with one adapter each are boilerplate. Pure logic is kept separate by file instead.
- **`src/` folder:** it moves everything, including `app/`, and touches every config, for no gain.
- **Colocating features inside `app/` (`app/admin/_components/…`):** it ties domain code to routes. `/admin/checkin` and the dynamics screens will reuse the admin blocks across routes.
- **A UI kit (shadcn) for the blocks:** this is a restructure. The visual system stays as it is (Tailwind spec, out of scope).

## Mobile

The structure itself has no mobile effect. Every task is checked at **390 px first**, then 1440, using the mocked admin screenshots (all sections, the auth screen, an open editor, the confirmation panel) and the public home and `/registro`.

The result must be pixel-identical to `main`. The only exception is the home marquee, which is animated.

No new client dependency. The bundle shrinks slightly because the home-cards editor is deleted.

## Order with the other branches

1. **This plan goes first.** Santiago's `feat/qr-checkin` and `feat/dynamics-admin` start inside `features/admin/` and reuse the blocks, instead of adding to 600-line files.
2. **`refactor/admin-tailwind`** (Tailwind plan Tasks 4, 4b, 5) comes after, moving these smaller components to utilities one by one. Its task list is updated to the new file names.

## Out of scope

- Splitting `supabase/functions/admin-pin/index.ts` (950 lines; `dynamicData` alone is about 500). It needs an edge-function deploy and a production test pass, so it gets its own spec and plan after this one.
- Moving styles to Tailwind (the Tailwind plan, Task 4).
- Any change to copy, behavior or the database.
