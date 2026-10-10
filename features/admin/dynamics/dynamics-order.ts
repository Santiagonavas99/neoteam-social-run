import type { DynamicRow, DynamicStatus } from '../types'

const priority: Record<DynamicStatus, number> = {
  open: 0,
  draft: 1,
  completed: 2,
  closed: 3,
  cancelled: 4,
}

/** Active activities first, preserving newest-first server order within each state. */
export function orderDynamicsByStatus(rows: DynamicRow[]): DynamicRow[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => priority[a.row.status] - priority[b.row.status] || a.index - b.index)
    .map(({ row }) => row)
}

export function challengeNeedsRules(row: Pick<DynamicRow, 'type' | 'description'>): boolean {
  return row.type === 'challenge' && (row.description?.trim().length ?? 0) < 10
}
