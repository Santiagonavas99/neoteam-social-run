import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DynamicRow } from '../types'
import { isRaffleDraw, isSocialRunWheelDraw, normalizeEventWheelDraw } from './event-draw-mode.ts'

function makeRow(key: string, status: DynamicRow['status'], mechanic: string): DynamicRow {
  return {
    id: key, name: key, type: 'raffle', status, points: 0, winner_count: 2,
    requires_checkin: true, prize: 'Premio', config: {
      source: 'programa_social_run_18_oct_2026', social_run_plan_key: key,
      mechanic, pending_review: true, exclude_winners: true,
    },
  }
}

test('the three Social Run wheels select winners as a single raffle, not QR spins', () => {
  for (const [key, status, mechanic] of [
    ['social-run-2026-10-18-highforce-ruleta','open','raffle'],
    ['social-run-2026-10-18-mmtulua-ruleta','draft','wheel'],
    ['social-run-2026-10-18-juancho-ruleta','completed','raffle'],
  ] as const) {
    const row = makeRow(key, status, mechanic)
    assert.equal(isSocialRunWheelDraw(row), true)
    assert.equal(isRaffleDraw(row), true)
    assert.equal(normalizeEventWheelDraw(row).winner_count, row.winner_count)
    assert.equal(normalizeEventWheelDraw(row).config?.exclude_winners, true)
    assert.equal(normalizeEventWheelDraw(row).requires_checkin, true)
  }
})

test('draft is normalized for the same atomic draw, without clearing approval gates', () => {
  const draft = makeRow('social-run-2026-10-18-mmtulua-ruleta','draft','wheel')
  const normalized = normalizeEventWheelDraw(draft)
  assert.equal(normalized.config?.mechanic,'raffle')
  assert.equal(normalized.config?.presentation,'wheel')
  assert.equal(normalized.config?.pending_review,true)
  assert.equal(draft.config?.mechanic,'wheel')
})

test('completed historical raffle remains unchanged; unrelated per-QR wheels are preserved', () => {
  const past = makeRow('social-run-2026-10-18-juancho-ruleta','completed','raffle')
  assert.equal(normalizeEventWheelDraw(past),past)
  const other = makeRow('some-other-event-wheel','open','wheel')
  assert.equal(isRaffleDraw(other),false)
  assert.equal(normalizeEventWheelDraw(other),other)
})
