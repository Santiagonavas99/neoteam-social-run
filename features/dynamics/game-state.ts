export type PublicGame = {
  id: string
  name: string
  type: string
  prize: string
  status: 'open' | 'completed'
  phase: 'ready' | 'countdown' | 'reveal' | 'finished'
  winnerCount: number
  shownCount: number
  updatedAt: string
  participations: number
  winners: { rank: number; name: string }[]
}

export function isGameId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function countdownValue(updatedAt: string, now: number): number {
  const started = Date.parse(updatedAt)
  return Number.isNaN(started) ? 0 : Math.max(0, 3 - Math.floor((now - started) / 1000))
}

export const demoGame: PublicGame = {
  id: 'demo',
  name: 'Sorteo de prueba',
  type: 'raffle',
  prize: 'Premio de demostración',
  status: 'completed',
  phase: 'reveal',
  winnerCount: 3,
  shownCount: 0,
  updatedAt: '2026-10-09T00:00:00.000Z',
  participations: 24,
  winners: [
    { rank: 1, name: 'Participante de prueba 1' },
    { rank: 2, name: 'Participante de prueba 2' },
    { rank: 3, name: 'Participante de prueba 3' },
  ],
}
