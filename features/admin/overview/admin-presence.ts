/** Admin presence is deliberately limited to authenticated panel tabs. */
export const PRESENCE_POLL_MS = 20_000
export const PRESENCE_HEARTBEAT_MS = 25_000
export const PRESENCE_IDLE_MS = 120_000
export const PRESENCE_EXPIRY_MS = 75_000

export type OnlineAdministrator = {
  name: string
  lastActiveAt: string
}

export function isPresenceCurrent(
  lastSeen: string,
  lastActive: string,
  now: number = Date.now(),
): boolean {
  const seen = Date.parse(lastSeen)
  const active = Date.parse(lastActive)
  return (
    Number.isFinite(seen) &&
    Number.isFinite(active) &&
    now - seen >= 0 &&
    now - seen < PRESENCE_EXPIRY_MS &&
    now - active >= 0 &&
    now - active < PRESENCE_IDLE_MS
  )
}

export function activityLabel(lastActive: string, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - Date.parse(lastActive))
  if (!Number.isFinite(elapsed)) return 'Actividad reciente'
  if (elapsed < 60_000) return 'Activo hace menos de 1 min'
  return `Activo hace ${Math.floor(elapsed / 60_000)} min`
}
