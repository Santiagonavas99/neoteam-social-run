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
  if (game.shownCount === 0) return { kind: 'drawn' }

  // Public API withholds the current winner until suspense is over.
  // Keep the reveal scene even when that name is not yet in the payload.
  const previous = winners.filter((winner) => winner.rank < game.shownCount)
  if (elapsed < REVEAL_SUSPENSE_MS) {
    return { kind: 'suspense', rank: game.shownCount, previous }
  }
  const winner = winners.find((item) => item.rank === game.shownCount)
  if (!winner) return { kind: 'suspense', rank: game.shownCount, previous }
  return { kind: 'winner', winner, previous }
}

export function canAdvanceDemo(game: PublicGame, now: number): boolean {
  return gameScene(game, now).kind !== 'suspense' && gameScene(game, now).kind !== 'countdown'
}
