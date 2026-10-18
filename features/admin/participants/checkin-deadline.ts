// SR26 check-in: October 18 2026 at 08:00 America/Bogota (13:00 UTC).
// UI advisory only; Supabase Edge + the database enforce the actual cutoff.
export const SR26_CHECKIN_CLOSES_AT = '2026-10-18T13:00:00.000Z'

export function shouldRequestCheckinException(nextStatus: string, now = Date.now()): boolean {
  return nextStatus === 'checked_in' && now >= Date.parse(SR26_CHECKIN_CLOSES_AT)
}
