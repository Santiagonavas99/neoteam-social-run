import type { DynamicRow } from '../types'

/** Repeat configuration, not participants, results, ID, status or old eligibility. */
export function duplicateDynamic(row: DynamicRow): DynamicRow {
  const suffix = ' (copia)'
  return {
    id: 'new-repeat-' + Date.now(),
    name: row.name.trim().slice(0, 120 - suffix.length).trimEnd() + suffix,
    description: row.description ?? '',
    type: row.type,
    status: 'draft',
    sponsor_brand_id: row.sponsor_brand_id ?? null,
    points: row.points,
    requires_checkin: row.requires_checkin,
    prize: row.prize ?? '',
    winner_count: row.winner_count,
    eligibility_dynamic_id: null,
    config: { ...row.config },
  }
}
