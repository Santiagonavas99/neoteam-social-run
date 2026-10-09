// All registration cutoffs are evaluated against the same absolute instant.
export const REGISTRATION_DEADLINE_ISO = '2026-10-10T20:00:00-05:00'
export const REGISTRATION_DEADLINE_LABEL = 'Sábado 10 de octubre · 8:00 p. m. (Colombia)'
export const REGISTRATION_CLOSED_MESSAGE =
  'Las inscripciones cerraron el sábado 10 de octubre a las 8:00 p. m. (hora de Colombia).'

export function isRegistrationClosed(now: number = Date.now()): boolean {
  return now >= Date.parse(REGISTRATION_DEADLINE_ISO)
}
