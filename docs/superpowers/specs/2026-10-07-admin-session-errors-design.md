# Keep the admin session through upstream errors — spec

Date: 2026-10-07 · Branch: `fix/admin-session-errors` · Status: **approved** (Iván, 2026-10-07: "dale con toda")

## Problem

Iván, 2026-10-07: "en la página de admin, ¿no podemos guardar una cookie para que no esté solicitando autenticación todo el tiempo?"

**There is already a 30-day session on both ends:**
- `lib/admin-proxy.ts` sets `neoteam_admin_session` (`HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=30 days`);
- `admin-pin` stores the session for 30 days (`SESSION_DAYS`).

**Remote data, 2026-10-07:**
- Santiago has 8 sessions created that day, and all 8 are still valid.
- Several older sessions keep being used after newer ones were created.

**So the sessions do not expire. Two things make people sign in again:**

1. **One cookie per address.**
   - Production (`www.socialrun.site`), every Vercel preview URL and `localhost` are different sites, and a browser never shares cookies between them.
   - With 7 PRs merged that day, opening previews explains most of the repeated sign-ins.
   - This is expected and stays as is.
2. **A bug: an upstream error signs the user out.**
   - `requireSession` (`supabase/functions/_shared/session.ts`) returns `null` both when the session does not exist and when the query fails (`if (error || !data) return null`).
   - `validate` then answers `{ valid: false }`, and the proxy reacts to `valid: false` by expiring the cookie (`sessionCookie(null)`).
   - So a slow or failed database call, or a timeout between Vercel and `sa-east-1`, deletes a perfectly valid 30-day session. Every other action does the same: on a failed query it answers 401, "Sesión no válida".

## Decision

1. **`requireSession` throws on a query error.** It returns `null` only when the session really does not exist, has expired or belongs to an inactive user.
   - The edge function already turns thrown errors into a 500.
   - The proxy turns that into its generic 502 ("connection error"), and it **keeps** the cookie.
2. **The `last_seen_at` update** stays best effort: a failure there neither throws nor signs out.
3. **The client** (`use-admin-session.ts`) already shows `bootError` with a retry when `validate` fails with a network or 5xx error, instead of the sign-in screen. Nothing changes there; the check confirms it.

## Alternatives rejected

- **A longer session (90 days, or no expiry):** the session is not what expires. It would only widen the window of a stolen device.
- **Keeping the token in `localStorage`:** page scripts could read it again, which the httpOnly cookie avoids on purpose (security hardening, 0.9.x).
- **One cookie across preview domains:** not possible across different hosts.

## Security

- **A real invalid session still clears the cookie.** That covers expired sessions, inactive users and sign-out.
- **Only errors stop clearing it.** An error never grants access: the request fails, and the next successful `validate` decides.

## Mobile

- **No visual change.** On a flaky 4G connection at the gate, staff now see "No pudimos conectar, reintenta" instead of being sent back to the sign-in screen.

## Also in this branch: the logo strip stops after a click

Iván, 2026-10-07: "cuando le doy a una tarjeta de marca o running me redirige, eso está correcto, pero el carrusel se para ya por completo".

- **Cause:** the strip pauses on `group-focus-within`, meant for keyboard users. A click or a tap leaves the focus on the link, and the focus is still there after coming back from the new tab, so the strip never resumes.
- **Fix:** pause on keyboard focus only (`:focus-visible`), and keep the hover pause (Tailwind's `hover:` already applies only on devices that hover).

## Out of scope

- Previews sharing the production session.
