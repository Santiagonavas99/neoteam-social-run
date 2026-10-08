# Persistent NeoTeam social rail on public pages — design

Date: 2026-10-08
Branch: `fix/desktop-community-connect-columns`, existing PR #67
Release: 0.29.1

## Problem
The right-edge "CONECTA" Instagram/WhatsApp rail is nested in the landing hero (`.v2-hero`) and uses `position: absolute`, so it disappears on scroll and does not exist on `/registro` and `/pase`.

## Approved design
- Extract exactly one accessible reusable `SocialRail` component to `components/social-rail.tsx` and mount it outside the hero: in the public home page and the shared `RegistrationShell` used by `/registro` and `/pase`. Never mount inside `/admin` (staff check-in must have an unobstructed interface).
- Preserve the original floating-edge NeoTeam visual language: black translucent card, border and rounded left corners; vertical "CONECTA" caption and one Instagram and one WhatsApp icon, existing public community URLs, accessible labels, opening in a new tab.
- Use a **viewport-fixed** position on wide desktop (`right:0; top:50%; transform:translateY(-50%)`), not `absolute` inside the hero. Keep it on top of page sections and behind important navigation overlays.
- At widths ≤1100px, keep the original compact **horizontal icon-only pill**, fixed above the bottom-right safe area. Respect ≥44×44 touch areas. RegistrationShell has existing bottom padding so form controls can be scrolled clear; do not add permanent empty space to every page.
- The rail is decorative navigation (links) with `aria-label`; no new JavaScript or dependencies and no duplicated rails on one page. Do not mutate the admin UI or external URLs. Disable hover translations for reduced motion.

## Alternatives
- RootLayout injection would render the floating rail on staff admin screens (unacceptable).
- An `absolute` rail on the hero does not follow the user.
- Two separate copies per route risk inconsistent links or keyboard navigation.

## Constraints and QA
Mobile-first at 390px and 430px, confirm pill within safe-area and no clipped elements; tablet 800px compact; desktop at 1101/1440px vertical. Scroll through hero, story, agenda and footer, and open /registro, /pase; rail must persist and be absent at /admin. Verify z-index, keyboard focus, both themes, two external links. GitHub CI `pnpm ci:check` and SQL; Vercel preview. No changes to DB, auth or registrations.
