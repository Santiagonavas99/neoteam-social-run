# Approved implementation plan — persistent public social rail

Spec: `docs/superpowers/specs/2026-10-08-persistent-public-social-rail-design.md`
Branch: `fix/desktop-community-connect-columns` (update existing PR #67)
User approval: "hagamos que este esté fijo en todo el sitio... no solo en el Hero".

1. Document scope, public routes and mobile safe-area design in spec and plan.
2. Extract JSX of `.v2-hero-social` out of `features/home/sections/hero.tsx` into reusable `components/social-rail.tsx`. Keep same accessible links and icons.
3. Render `SocialRail` exactly once in `app/page.tsx` outside the hero and in `features/registration/registration-shell.tsx`, so it covers public pages but not admin.
4. Replace `.v2-hero-social` styling in `app/home-v2.css` with `.site-social-rail` position fixed in desktop and mobile compact safe-area presentation. Remove hero-scoped media rule and hero entrance fade so the global rail does not flash/reset during long scroll.
5. Expand the existing 0.29.1 changelog entry and PR description. Keep package version at 0.29.1 (PR is still open).
6. Validate GitHub CI lint/typecheck/tests/build and SQL; Vercel preview, mobile at 390/430 and desktop at 1101/1440 and both /registro and /pase. Do not merge to production without requested authorization.

7. User-approved WhatsApp brand vector: add `components/whatsapp-icon.tsx` with the supplied two exact SVG paths and `SVGProps<SVGSVGElement>`, matching the existing InstagramIcon pattern. Swap the WhatsApp-only `MessageCircle` usages in `components/social-rail.tsx` and `features/registration/community-connect.tsx`. Keep the current 16/20px sizes, links and aria-labels unchanged.
8. Note the brand icon consistency in the existing 0.29.1 changelog and in the PR body, rerun CI/SQL and Vercel preview. Do not publish production.
