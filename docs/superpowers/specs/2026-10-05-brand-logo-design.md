# NeoTeam logo and favicon — spec

Date: 2026-10-05 · Branch: `feat/brand-logo` (from `main` at 0.2.1) · Status: **approved 2026-10-05**

## Problem

The site has no favicon (the tab shows the browser default), and the brand is a placeholder made of a green "N" square and the word NEOTEAM, typed as text. Iván supplied the official files (2026-10-05), kept as is in `design/brand/`:
- `logo_neoteam.svg`, 1207×380: "NEO TEAM / RUN & HIKE";
- `favicon_neoteam.svg`, 704×442: "NT" with an underline.

He asked to check how they look on the app's backgrounds and adjust them if needed.

## Review on the real backgrounds

`design/brand/2026-10-05-original-on-backgrounds.png` shows the files as delivered. Both use white letters (`#FEFEFE`) and cyan accents (`#02F2F8`) on a transparent background.

| Surface | Background | Result as delivered |
|---------|-----------|---------------------|
| Home hero header, admin sidebar | `#050505` | Good (cyan 14.6:1) |
| `/registro` header, admin login | `--neo-bg` `#f4f6f5` | **Invisible**: white on near-white, cyan 1.28:1 |
| Light browser tab | `#fff` | **Invisible** favicon |
| Dark browser tab | `#202124` | Good |

The favicon is also 704×442, not square, so browsers squash it or letterbox it.

## Decisions

1. **The logo is an inline SVG component that takes the surface color**, `components/neoteam-logo.tsx`:
   - white letters become `currentColor`, so they turn black on light surfaces and white on dark ones;
   - cyan becomes the new token `--neo-brand-cyan`: `#02F2F8` on dark surfaces, `#007a78` on light ones (4.77:1 on `#f4f6f5`, AA);
   - the paths are not redrawn; only the fills change.

   Inline rather than an `<img>`, because an `<img>` cannot inherit `currentColor`. At about 7 KB it costs less than a second request.
2. **`BrandLink` renders the logo** in place of the "N" square and the NEOTEAM text, which are removed together with the `.brand-mark` CSS.
   - It appears in three places: the home header, the admin sidebar and the admin login.
   - `/registro` has its own copy of the old markup; that copy is replaced by `BrandLink`.
   - The link keeps an accessible name ("NeoTeam" by default, "Social Run NeoTeam" in the home header). The SVG is `aria-hidden`.
3. **Favicon `app/icon.svg`** (Next.js file convention: Next adds the `<link rel="icon">` itself, no `public/` folder needed).
   - The "NT" mark sits centered on a black square, 64×64 with 14 px rounded corners, so it reads on light and dark tabs alike (`design/brand/2026-10-05-adjusted-on-backgrounds.png`).
   - The mark fills about 80 % of the width so it stays legible at 16 px.
4. **Size:** the logo is 32 px tall on mobile (about 102 px wide) and 36 px from `md:` up.
5. **Version 0.3.0** (Iván asked to cut a release). New user-visible feature → minor version.

**Rejected:**
- *Two files, logo-white and logo-dark:* two assets to keep in sync for a color change that `currentColor` already handles.
- *Keeping the cyan on light surfaces:* 1.28:1 cannot be read.
- *PNG `apple-icon` for the iPhone home screen:* nobody installs this site. Add it if Iván wants it later.

## Brand note for Iván

The logo's cyan (`#02F2F8`) is not the site accent green (`--neo-accent` `#6fa39c`), even though `DESIGN.md` calls that green "NeoTeam logo green". This plan uses the cyan only inside the logo and leaves the accent alone. Retuning the accent to match the logo is a separate decision.

## Mobile

- **At 390 px:**
  - the home header holds the logo (102 px) and the "Registrarme" button with no wrap;
  - the admin top bar and `/registro` ("Volver al evento") are checked the same way.
- **Hit area:** the link stays at least 44 px tall.
- **Cost:** no new dependency and about 7 KB of inline markup.

## Out of scope

- Changing the accent color.
- Open Graph or social share images.
- A web app manifest.
