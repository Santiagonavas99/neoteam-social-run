# Automatic WebP upload in admin — design spec

Date: 2026-10-07 · Branch: `feat/admin-webp-image-uploads`

## Problem

Admin image uploads require PNG, JPG or WEBP below 4 MB **before** upload. Staff may upload bigger phone photos, HEIC, AVIF, GIF or BMP, and manually converting them is slow. The existing single shared upload hook already serves the logos, crews, brands and organizations.

## Decision

- Convert browser-decodable raster images on-device to **static WebP** in the shared admin upload hook, before base64 and network transfer.
- Encode at WebP quality 0.9, retry with lower quality and dimensions until the **output** fits the existing 4 MiB backend limit. Keep aspect ratio; never upscale. Preserve alpha (transparent logos).
- Limit originals to 40 MiB and decoded images to 80 MP for mobile memory safety.
- Accept raster formats exposed by the browser and camera/photo picker, including HEIC/HEIF only when that browser actually decodes them. Do not claim universal codec support.
- Reject SVG (not raster; unsafe/unpredictable when rendered), non-images and browser-unsupported formats with actionable Spanish errors. Animated GIFs become a static frame.
- Keep the upload API body and `uploadAdminImage` edge function untouched: still `{ mime, content }`, now with `mime: 'image/webp'`, and the server still enforces its own MIME, signature and size checks.
- Retain existing upload success callback and editor lock. Show automatic conversion and useful compression feedback.

## Rejected alternatives

- Server-side conversion: new dependency/runtime cost, extra processing on a privileged edge function.
- Relaxing the 4 MB or MIME allowlist: would weaken the current upload contract.
- Adding an image-processing dependency: unnecessary bundle cost for a mobile-first admin.
- Silently uploading the original on conversion failure: violates the WebP promise.

## Mobile and design

Mobile first (390 px). No new permanent controls or layout changes; existing upload field, focus and touch target styles remain. Update the hint to match accepted formats and final WebP. Processing happens locally before the existing upload spinner finishes; prefer one canvas to avoid excess memory. No added client dependency.

## Security and compatibility

No changes to auth, session cookie, registration, Wallet, QR, Supabase tables, storage bucket, image URL format, gzip proxy, or existing images. Existing PNG and JPG images in storage remain valid; only new uploads are WebP.

## Verification

Unit tests for type screening, dimensions and no upscaling; existing `pnpm ci:check`. Mobile browser QA at 390 px using opaque JPG, transparent PNG, HEIC (where supported), oversize image, bogus file and unsupported SVG; verify preview, save, reload and production remains unchanged until merge.
