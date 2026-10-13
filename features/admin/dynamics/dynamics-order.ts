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

export type DynamicPhaseGroup = {
  id: 'open' | 'draft' | 'finished'
  title: string
  description: string
  rows: DynamicRow[]
}

/** Visual grouping after category/search filtering, without altering source rows. */
export function groupDynamicsByPhase(rows: DynamicRow[]): DynamicPhaseGroup[] {
  const definitions: Array<Pick<DynamicPhaseGroup, 'id' | 'title' | 'description'>> = [
    { id: 'open', title: 'Activas', description: 'Listas para ejecutar' },
    { id: 'draft', title: 'Por preparar', description: 'Configura antes de activar' },
    { id: 'finished', title: 'Finalizadas', description: 'Consulta su historial' },
  ]
  return definitions
    .map((group) => ({
      ...group,
      rows: rows.filter((row) =>
        group.id === 'finished' ? !['open', 'draft'].includes(row.status) : row.status === group.id,
      ),
    }))
    .filter((group) => group.rows.length > 0)
}
