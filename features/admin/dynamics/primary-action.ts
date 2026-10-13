import type { DynamicStageStatus, DynamicStatus } from '../types'

export type GamePrimaryAction = 'countdown' | 'draw' | 'prepare' | 'next' | 'finish' | null

export function gamePrimaryAction(
  status: DynamicStatus,
  stage: Pick<DynamicStageStatus, 'phase' | 'shown_count'> | null,
  winnerCount: number,
): GamePrimaryAction {
  if (status === 'open') return stage?.phase === 'countdown' ? 'draw' : 'countdown'
  if (status !== 'completed') return null
  const phase = stage?.phase ?? 'ready'
  if (phase === 'finished') return null
  if (phase === 'ready' || phase === 'countdown') return 'prepare'
  return (stage?.shown_count ?? 0) < winnerCount ? 'next' : 'finish'
}
