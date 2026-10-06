# Cyan palette refresh — design spec

Date: 2026-10-05  
Branch: `feat/cyan-accent-refresh`

## Problem

NeoTeam currently mixes the new electric cyan with legacy green-tinted neutrals and ad-hoc teal values. The result is visually inconsistent: the accent changed, but the supporting surfaces, text, borders and interaction states still belong to the previous green system.

The supplied palette becomes the visual source of truth. Its defining idea is a brand cyan at hue ~193.7° and a neutral scale carrying a subtle amount of the same hue instead of the old green cast.

## Decision

Adopt the supplied cyan and neutral ramps as palette primitives, then map the existing semantic `--neo-*` tokens to those primitives. Components continue consuming semantic tokens; they do not choose arbitrary ramp values.

### Cyan ramp

| Token | Value |
|---|---|
| `--neo-cyan-50` | `#defffd` |
| `--neo-cyan-100` | `#b3fffd` |
| `--neo-cyan-brand` | `#03f8f6` |
| `--neo-cyan-300` | `#13e7e5` |
| `--neo-cyan-400` | `#0fd1d0` |
| `--neo-cyan-500` | `#0fb5b3` |
| `--neo-cyan-600` | `#078c8b` |
| `--neo-cyan-700` | `#077271` |
| `--neo-cyan-800` | `#065958` |
| `--neo-cyan-900` | `#004141` |
| `--neo-cyan-950` | `#002d2d` |

### Neutral ramp

| Token | Value |
|---|---|
| `--neo-neutral-50` | `#f2f8f8` |
| `--neo-neutral-100` | `#e9f0f0` |
| `--neo-neutral-200` | `#d9e4e3` |
| `--neo-neutral-300` | `#c2cdcd` |
| `--neo-neutral-400` | `#a3adad` |
| `--neo-neutral-500` | `#737d7c` |
| `--neo-neutral-600` | `#5c6565` |
| `--neo-neutral-700` | `#27302f` |
| `--neo-neutral-800` | `#192121` |
| `--neo-neutral-900` | `#111a1a` |
| `--neo-neutral-950` | `#080f0e` |

## Semantic mapping

Light surfaces:
- Primary brand accent: cyan brand `#03f8f6`.
- Accent text on light surfaces: cyan 700 `#077271`; the brand cyan is too light for body-sized text.
- Strong cyan surfaces with light text: cyan 800 `#065958`.
- Hover on bright accent controls: cyan 300 `#13e7e5`.
- Soft accent surface: cyan 50 `#defffd`.
- Focus indicator: cyan 600 `#078c8b` so the focus outline has enough contrast on light surfaces.
- Main text: neutral 950 `#080f0e`.
- Page background: neutral 50 `#f2f8f8`.
- Secondary text: neutral 600 `#5c6565`.
- Structural borders and quiet fills use neutral 100–300 rather than green-tinted legacy values.

Dark surfaces:
- Background: neutral 950 `#080f0e`.
- Raised surface: neutral 900 `#111a1a`.
- Main text: neutral 50 `#f2f8f8`.
- Secondary text: neutral 400 `#a3adad`.
- Borders: neutral 700 `#27302f`.
- Accent text and focus: brand cyan `#03f8f6`.
- Soft accent background: cyan 950 `#002d2d`.

Pure white may remain only where the interface explicitly needs an absolute white surface or asset background. Status colors such as danger remain semantic and are not forced into the cyan ramp.

## Accessibility

The brand cyan is intentionally bright and must not be used as small text on light backgrounds. Use cyan 700 for accent text on light surfaces. Focus rings use cyan 600 instead of the brand cyan because the brand tone does not provide sufficient non-text contrast against the light neutral background.

Dark filled controls that carry white/light text use cyan 800 or darker.

Color never becomes the only status indicator.

## UI scope

Apply the system consistently to:
- public home;
- registration and shared form controls;
- admin shell, active navigation and panels;
- shared buttons, links, focus states, carousels and confirmation surfaces.

Replace legacy greenish neutrals in `app/globals.css`, `app/home-v2.css` and `app/neo-overrides.css` when they represent a neutral/accent role covered by the new system.

## Mobile

The palette must be checked first at 390 px on the home, registration and admin surfaces. Bright cyan may occupy compact controls and small accents, but large mobile surfaces should prefer the neutral ramp or deep cyan to avoid glare.

## Alternatives rejected

- Replacing only `#6fa39c` with `#03f8f6`: rejected because the surrounding green neutrals would keep the old hue and make the new cyan feel pasted on.
- Using `#03f8f6` for accent text everywhere: rejected for insufficient contrast on light surfaces.
- Inventing intermediate cyan/gray values outside the supplied palette: rejected; the supplied ramps are sufficient.

## Out of scope

No layout, typography, copy, feature, database, authentication, Wallet, QR or admin behavior changes. No new dependency.
