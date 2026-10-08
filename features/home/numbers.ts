// Show a minimum public count until actual registrations exceed it.
export const RUNNER_COUNT_FLOOR = 50

export const runnersShown = (registered: number | null) =>
  Math.max(RUNNER_COUNT_FLOOR, registered ?? 0)

// Ease-out cubic: fast start, gentle landing on the final number.
export function countUpValue(target: number, progress: number) {
  const clamped = Math.min(Math.max(progress, 0), 1)
  return Math.round(target * (1 - (1 - clamped) ** 3))
}
