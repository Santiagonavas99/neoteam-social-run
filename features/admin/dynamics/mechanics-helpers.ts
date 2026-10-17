export type TimedScore = {
  id: string
  elapsed_ms: number
  status: 'running' | 'paused' | 'finished'
}

export function formatElapsed(ms: number): string {
  const centis = Math.floor(Math.max(0, ms) / 10)
  const secs = Math.floor(centis / 100)
  const hours = Math.floor(secs / 3600)
  const minutes = Math.floor((secs % 3600) / 60)
  const seconds = secs % 60
  return (
    (hours ? String(hours).padStart(2, '0') + ':' : '') +
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0') +
    '.' +
    String(centis % 100).padStart(2, '0')
  )
}

export function rankTimes<T extends TimedScore>(runs: T[], direction: 'min' | 'max') {
  const sorted = runs
    .filter((run) => run.status === 'finished')
    .sort(
      (a, b) =>
        (direction === 'min' ? a.elapsed_ms - b.elapsed_ms : b.elapsed_ms - a.elapsed_ms) ||
        a.id.localeCompare(b.id),
    )
  return sorted.map((run) => ({
    run,
    place: sorted.findIndex((item) => item.elapsed_ms === run.elapsed_ms) + 1,
    tied: sorted.some((item) => item.id !== run.id && item.elapsed_ms === run.elapsed_ms),
  }))
}

export function remainingStock<T extends { id: string; quantity: number }>(
  prizes: T[],
  spins: Array<{ prize_key: string | null }>,
) {
  return prizes.map((prize) => ({
    ...prize,
    remaining: Math.max(
      0,
      prize.quantity - spins.filter((entry) => entry.prize_key === prize.id).length,
    ),
  }))
}
