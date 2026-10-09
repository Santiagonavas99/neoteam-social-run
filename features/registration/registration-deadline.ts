export type RegistrationSettings = {
  deadline: string | null
  registrationOpen: boolean
}

export const REGISTRATION_UNAVAILABLE_MESSAGE =
  'No podemos confirmar que las inscripciones estén abiertas. Inténtalo de nuevo en unos minutos.'

export function isRegistrationClosed(settings: RegistrationSettings, now = Date.now()): boolean {
  return !settings.registrationOpen || (settings.deadline !== null && now >= Date.parse(settings.deadline))
}

export function registrationDeadlineLabel(deadline: string | null): string {
  if (!deadline) return 'Sin fecha límite'
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(deadline))
}

export function colombiaLocalInput(deadline: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(deadline))
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

export function colombiaInputToUtc(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null
  const date = new Date(`${local}:00-05:00`)
  if (Number.isNaN(date.valueOf())) return null
  // Bogotá does not use daylight saving time; reject normalized impossible dates.
  if (new Date(date.valueOf() - 5 * 60 * 60 * 1000).toISOString().slice(0, 16) !== local) {
    return null
  }
  return date.toISOString()
}
