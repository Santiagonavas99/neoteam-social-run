import { matchesQuery } from '../filter.ts'
import { dynamicTypes } from '../labels.ts'
import type { DynamicRow, DynamicStatus } from '../types'

/** One mobile list: active dynamics first, then drafts, then finished history. */
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
