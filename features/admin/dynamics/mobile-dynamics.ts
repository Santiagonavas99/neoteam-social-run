import { matchesQuery } from '../filter'
import { dynamicTypes } from '../labels'
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

export function filterMobileDynamics(rows: DynamicRow[], phase: MobilePhase, query: string): DynamicRow[] {
  return rows.filter((row) =>
    phaseForStatus(row.status) === phase &&
    matchesQuery([row.name, row.description, row.prize, dynamicTypes[row.type]], query),
  )
}
