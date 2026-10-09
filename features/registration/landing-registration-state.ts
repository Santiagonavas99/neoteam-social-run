import { isRegistrationClosed, type RegistrationSettings } from './registration-deadline.ts'

export type LandingRegistrationState = 'open' | 'closed' | 'unavailable'

export function landingRegistrationState(
  settings: RegistrationSettings | null,
  now = Date.now(),
): LandingRegistrationState {
  if (!settings) return 'unavailable'
  return isRegistrationClosed(settings, now) ? 'closed' : 'open'
}
