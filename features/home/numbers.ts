// Iván, 2026-10-07: the runner counter starts at 20 on top of the real registrations.
export const RUNNER_BASELINE = 20

export const runnersShown = (registered: number) => RUNNER_BASELINE + registered

// Ease-out cubic: fast start, gentle landing on the final number.
export function countUpValue(target: number, progress: number) {
  const clamped = Math.min(Math.max(progress, 0), 1)
  return Math.round(target * (1 - (1 - clamped) ** 3))
}
