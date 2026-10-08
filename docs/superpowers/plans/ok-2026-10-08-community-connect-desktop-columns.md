# Approved implementation plan — CommunityConnect desktop columns

Spec: `docs/superpowers/specs/2026-10-08-community-connect-desktop-columns-design.md`
Branch: `fix/desktop-community-connect-columns`
Approved by user proposing two columns for desktop in the supplied current screenshot.

1. Add this spec and plan with mobile-first breakpoint reasoning and QA sizes.
2. In `features/registration/community-connect.tsx`, introduce a left text wrapper, retain all three copy strings, and make the section a `lg:` two-column CSS grid with a slightly wider right actions track. Keep the original narrow centered/mobile layout and stack buttons on the right at desktop. No new CSS file/dependency.
3. Add release `0.29.1` to `CHANGELOG.md` and `package.json` while preserving previous versions.
4. Validate the PR with `pnpm ci:check` and SQL checks in GitHub Actions, plus Vercel preview; compare mobile at 390/430 and desktop at 1024/1440. Do not merge into production until requested.
