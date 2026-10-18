import { matchesQuery } from '../filter.ts'
import { dynamicTypes } from '../labels.ts'
import type { DynamicRow, DynamicStatus } from '../types'

export type MobilePhase = 'en-vivo' | 'preparar' | 'resultados'

export const mobilePhaseLabels: Record<MobilePhase, string> = {
  'en-vivo': 'En vivo',
  preparar: 'Preparar',
  resultados: 'Resultados',
}

export function phaseForStatus(status: DynamicStatus): MobilePhase {
  if (status === 'open') return 'en-vivo'
  if (status === 'draft') return 'preparar'
  return 'resultados'
}

/** Search across all dynamic types; only the lifecycle phase filters mobile. */
export function filterMobileDynamics(
  rows: DynamicRow[],
  phase: MobilePhase,
  query: string,
): DynamicRow[] {
  return rows.filter(
    (row) =>
      phaseForStatus(row.status) === phase &&
      matchesQuery([row.name, row.description, row.prize, dynamicTypes[row.type]], query),
  )
}

/** Event-day Mobile: one list, active first, then drafts, then historical results. */
export function sortMobileDynamics(rows: DynamicRow[], query: string): DynamicRow[] {
  const priority: Record<DynamicStatus, number> = {
    open: 0,
    draft: 1,
    completed: 2,
    closed: 3,
    cancelled: 4,
  }
  return rows
    .filter((row) =>
      matchesQuery([row.name, row.description, row.prize, dynamicTypes[row.type]], query),
    )
    .sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9) ||
      a.name.localeCompare(b.name, 'es'))
}
