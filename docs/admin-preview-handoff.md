# Admin preview — checkpoint 2026-10-04 (America/Bogota)

## Scope
- Repository: Santiagonavas99/neoteam-social-run
- Branch: feat/home-carousels-sticky-agenda. Do not merge to main without approval.
- Production remains unchanged.

## Completed
- Remote fix commit: 74fccb028ae023076637bcde79489712c0e8ad73.
- Added POST /api/admin server proxy; admin client no longer reads Supabase environment variables.
- Proxy accepts SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY with NEXT_PUBLIC equivalents as fallback. No service-role key.
- Updated .env.example. Existing authentication and Edge Function unchanged.
- Image requests use gzip transport to preserve existing 4 MB uploads through Vercel; upstream still receives the existing JSON contract.
- Typecheck and build passed. Build required a fresh local Turbopack cache after an internal panic.
- Mocked proxy checks passed: missing config, server/public fallback, payload/session forwarding, PIN error status, sanitized upstream errors, invalid body and 4 MB compressed upload.
- Vercel deployment confirmed Ready in authenticated UI, correct branch and commit.
- Deployment: https://vercel.com/cositasgpt1234-3458/neoteam-social-run/i8umYq7b3Ed5HgLyKobAcYN5LP6u
- Preview domain observed in deployment UI: https://neoteam-social-lejw5fnno-cositasgpt1234-3458.vercel.app

## Confirmed configuration findings
- Vercel project neoteam-social-run, team cositasgpt1234-3458.
- Both NEXT_PUBLIC Supabase variables exist separately for Production, global Preview and branch-specific Preview (feat/home-carousels-sticky-agenda).
- Values were masked and were not compared. Duplicates alone do not establish the root cause.
- No environment variables were changed or deleted.
- Earlier Vercel connector requests returned 403; after reconnection they returned Unknown tool. User authorized browser fallback.
- Browser login to Vercel succeeded. Subsequent browser automation was blocked by native credential protection; manual handoff was offered on environment settings. Do not bypass that protection.

## Resume
1. Check current branch/deployment and connector availability before editing.
2. Compare relevant env configuration without logging values; establish the actual cause. Preserve correct Production values. Make Preview configuration apply to all branches and resolve conflicting branch overrides only after comparison.
3. Create a new Preview deployment after any env correction.
4. Test /admin on that exact deployment: status, PIN login, dashboard, refresh session, logout and login again. Use secure credential handoff; never request PIN/password/OTP in chat.
5. Verify Production read-only. Report exact tested preview URL and any remaining blockers.

## Not yet verified
- Actual proxy connection to admin-pin in deployed Preview; real login/session/logout cycle.
- Production regression check.
- End-to-end image upload through deployed proxy.
- Visual carousel QA at 1440/1024/768/390 remains pending from earlier work.

No PIN, credential, cookie or API-key values are stored in this checkpoint.
