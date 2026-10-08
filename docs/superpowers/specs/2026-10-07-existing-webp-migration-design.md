# Convert existing admin logos to WebP — design spec

Date: 2026-10-07 · Branch: `feat/admin-webp-image-uploads` · Extension requested after the initial WebP upload PR.

## Inventory (remote Supabase, read-only)

The `admin-media` bucket currently has 21 PNG/JPEG objects. Of those, 17 distinct URLs are referenced by the current `running_groups` (9) and `home_logo_carousel_items` (8) rows. One `brands` row uses a bundled local `/neoteam-logo.png`, not Storage. Four bucket objects are presently unreferenced and must not be auto-relinked or deleted.

## Problem

The new upload compressor only affects future uploads. Current images remain PNG/JPEG in Storage, even though Next/image can optimize their delivery.

## Decision

Add an explicit **Optimizar imágenes actuales** action to the admin logos screen, with a preview/confirmation count. It migrates only the existing referenced, project-owned PNG/JPG/JPEG URLs from `admin-media` across `groups`, `brands` and `home_logo_carousel_items`:

1. Fetch current records through the existing admin endpoints (never direct browser DB access).
2. Select URLs strictly within this project's public `admin-media` bucket; skip external URLs, local bundled images, already-WebP and unexpected types.
3. For each, download the public original in the browser; convert/compress using the new client-side WebP helper; upload via authenticated `uploadAdminImage` (new unique object).
4. Update the relevant row using existing admin actions only **after** upload succeeds. Leave existing objects intact as backups. Do not rename their existing storage paths or change legacy URLs in other contexts.
5. For groups/brands, the existing `adminData save` recalculates `slug` from the name. Skip rows whose current slug would change; write only `id`, `name` and `logo_url`, never other business fields. For carousel rows, preserve all existing fields on save.
6. Process sequentially, show per-item progress and final succeeded/failed/skipped counts, and leave a failed item's old URL unchanged. Subsequent runs skip successfully migrated rows because they now end in `.webp`.

## Safeguards

- No auto-start on page load, no work during preview/CI or visiting public pages.
- The action requires an authenticated admin session and explicit confirmation; preview may share the live Supabase backend, so testers must not trigger it casually.
- Do not delete originals. No new server, SQL migration, Storage bucket rule, edge function or API contract.
- If a DB save fails after upload, that new WebP may be orphaned but the original reference stays live.
- On a concurrent record change, avoid clobbering by checking the current URL again before saving.
- Existing public previews and design are unchanged until an operator confirms and performs this migration.

## Mobile

390 px-first compact action/button and progress with Spanish copy, keyboard-accessible, min 44 px touch target. No additional dependency. An operator may prefer desktop to keep the tab open during sequential conversion.

## Tests

Pure tests for strict URL matching, file-name handling and slug safety; existing `pnpm ci:check` and SQL checks. Manual QA on a test image before executing against the 17 production references. Verify a saved WebP URL, `Content-Type: image/webp`, unchanged registration slugs, working marquees and no missing images at 390px/1440px.

## One-time production-only action (follow-up 2026-10-07)

The button is visible **only** on Vercel production, and only after the admin has fetched the current data and confirmed at least one referenced legacy PNG/JPEG from the project's Storage. Never display it while checking, in Preview or in local development.

The migration itself is not automatic. After a confirmed run, re-fetch all three admin collections. As soon as no qualifying old references remain, hide the button immediately and on every later session/device; the database's actual image URLs are the durable source of truth (not localStorage, browser cookies or new SQL state). Keep the confirmation and processing states accessible while work is in progress. If a file cannot be converted, keep its original reference and offer a retry only for the remaining files: never silently mark the migration done while legacy images remain. New admin image uploads already use WebP, so completing the initial backlog naturally retires the action.

Passing the production flag from the server-side `app/admin/page.tsx` prevents the action being offered by a Preview that shares Supabase. It does not change the privilege model or mutate Supabase by itself. Simultaneous starts from two different administrators are not globally locked; the existing before-save URL rechecks reduce, but do not eliminate, duplicate uploads. No new DB/edge migrations.
