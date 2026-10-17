// SR26: Sunday 18 October 2026, 08:00 America/Bogota (UTC-5).
// This same instant is enforced at the database level by the SR26 check-in migration.
export const SR26_CHECKIN_CLOSES_AT = '2026-10-18T13:00:00.000Z'
export const CHECKIN_CLOSED_MESSAGE =
  'El check-in cerró el domingo 18 de octubre a las 8:00 a. m. (Colombia). Contacta a un administrador para una excepción.'

export function isCheckinClosed(now = Date.now()): boolean {
  return now >= Date.parse(SR26_CHECKIN_CLOSES_AT)
}
