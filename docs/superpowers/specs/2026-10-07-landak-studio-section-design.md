# Landak Studio Home section — design spec

Date: 2026-10-07 · Branch: `feat/landak-studio-section`

## Goal

Give Landak Studio visible authorship and portfolio exposure on the Social Run landing page without turning the event site into an agency ad.

Landak already has a compact footer credit. This new section is a stronger editorial attribution placed near the end of the Home, before the fixed footer.

## Content

Eyebrow:
**CREATIVE PARTNER**

Primary brand:
**LANDAK STUDIO**

Headline:
**ESTA EXPERIENCIA DIGITAL TAMBIÉN LA CONSTRUIMOS.**

Body:
**Diseño, UX/UI y desarrollo web para marcas que quieren moverse con intención.**

Service line:
**WEB DESIGN · UX/UI · BRANDING · VISUAL**

CTA:
**Conoce Landak Studio ↗**

Destination:
`https://landak.pro/`

## Visual direction

The section belongs to NEOTEAM first and Landak second.

- dark NeoTeam background;
- cyan accent used sparingly;
- Host Grotesk;
- thin editorial rules;
- oversized Landak wordmark rather than an imported image asset;
- two-column desktop composition: Landak identity / attribution copy;
- compact, centered mobile composition;
- no gradients, external images or decorative mockups.

The section should feel like a production credit / creative partner slate, not a sponsor card.

## Section ordering

Add `landak_studio` to the existing configurable Home section registry.

- visible by default;
- default position: last configurable section, immediately before Footer;
- can be moved up/down from Admin;
- can be hidden/restored from Admin;
- Hero and Footer remain fixed.

## Accessibility

- semantic `section` with labelled heading;
- CTA is a normal external link;
- `target="_blank"` includes `rel="noopener noreferrer"`;
- link copy is descriptive without relying on the icon.

## Mobile

At ≤760 px:
- center the Landak wordmark and copy;
- CTA remains at least 44 px high;
- service line wraps intentionally;
- no horizontal overflow.

## Data / security

The only data change is allowing the new `landak_studio` key in `home_section_order` and seeding one visible row for SR26.

Existing RLS and admin proxy rules remain unchanged.

## Out of scope

- CMS-editable Landak copy.
- Uploading a separate Landak logo.
- Tracking/analytics specific to Landak CTA.
- Changing the existing footer attribution.
