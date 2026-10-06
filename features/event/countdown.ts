export type Countdown =
  | { state: 'upcoming'; days: number; hours: number; minutes: number; seconds: number }
  | { state: 'live' }
  | { state: 'ended' }

export function countdown(nowMs: number, startMs: number, endMs: number): Countdown {
  if (nowMs >= endMs) return { state: 'ended' }
  if (nowMs >= startMs) return { state: 'live' }
  const total = Math.ceil((startMs - nowMs) / 1000)
  return {
    state: 'upcoming',
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}
