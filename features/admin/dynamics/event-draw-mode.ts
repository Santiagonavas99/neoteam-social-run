import type { DynamicRow } from '../types'

const SOCIAL_RUN_WHEEL_KEYS = new Set([
  'social-run-2026-10-18-highforce-ruleta',
  'social-run-2026-10-18-mmtulua-ruleta',
  'social-run-2026-10-18-juancho-ruleta',
])

/** A wheel-shaped *reveal* is not a per-person prize-inventory wheel. */
export function isSocialRunWheelDraw(row: Pick<DynamicRow, 'type' | 'config'>): boolean {
  return row.type === 'raffle' &&
    row.config?.source === 'programa_social_run_18_oct_2026' &&
    SOCIAL_RUN_WHEEL_KEYS.has(String(row.config?.social_run_plan_key ?? ''))
}

export function isRaffleDraw(row: Pick<DynamicRow, 'type' | 'config'>): boolean {
  if (row.type !== 'raffle') return false
  if (isSocialRunWheelDraw(row)) return true
  return !['wheel', 'ruleta_pendiente'].includes(String(row.config?.mechanic ?? ''))
}

/** Safe normalization when saving event drafts, never altering a finished raffle. */
export function normalizeEventWheelDraw(row: DynamicRow): DynamicRow {
  if (!isSocialRunWheelDraw(row) || row.status === 'completed' || row.status === 'closed') {
    return row
  }
  return {
    ...row,
    config: {
      ...row.config,
      mechanic: 'raffle',
      presentation: 'wheel',
    },
  }
}
