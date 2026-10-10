import type { PublicGame } from './game-state'

export const REVEAL_SUSPENSE_MS = 3200

export type GameScene =
  | { kind: 'ready' }
  | { kind: 'countdown'; remaining: number }
  | { kind: 'anticipation' }
  | { kind: 'drawn' }
  | { kind: 'suspense'; rank: number; previous: PublicGame['winners'] }
  | { kind: 'winner'; winner: PublicGame['winners'][number]; previous: PublicGame['winners'] }
  | { kind: 'finished'; winners: PublicGame['winners'] }
  | { kind: 'activity' }

export function gameScene(game: PublicGame, now: number): GameScene {
  if (game.type !== 'raffle') return { kind: 'activity' }
  if (game.phase === 'ready') return { kind: 'ready' }
  const updated = Date.parse(game.updatedAt)
  const elapsed = Number.isFinite(updated) ? Math.max(0, now - updated) : 0

  if (game.phase === 'countdown') {
    const remaining = Math.max(0, 3 - Math.floor(elapsed / 1000))
    return remaining ? { kind: 'countdown', remaining } : { kind: 'anticipation' }
  }

  const winners = game.winners.slice(0, game.shownCount)
  if (game.phase === 'finished') return { kind: 'finished', winners }
  if (winners.length === 0) return { kind: 'drawn' }

  const winner = winners.at(-1)
  if (!winner) return { kind: 'drawn' }
  const previous = winners.slice(0, -1)

  // The operator has authorized the next reveal, but the name stays outside
  // the rendered DOM until the deterministic suspense window ends.
  if (elapsed < REVEAL_SUSPENSE_MS) {
    return { kind: 'suspense', rank: winner.rank, previous }
  }
  return { kind: 'winner', winner, previous }
}

export function canAdvanceDemo(game: PublicGame, now: number): boolean {
  return gameScene(game, now).kind !== 'suspense' && gameScene(game, now).kind !== 'countdown'
}
