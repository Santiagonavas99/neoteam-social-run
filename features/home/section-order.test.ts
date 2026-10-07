import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  defaultHomeSectionOrder,
  normalizeHomeSectionOrder,
} from './section-order.ts'

test('uses the editorial default order when no rows are stored', () => {
  assert.deepEqual(normalizeHomeSectionOrder([]), defaultHomeSectionOrder)
})

test('uses saved numeric order and fills missing sections from defaults', () => {
  const ordered = normalizeHomeSectionOrder([
    { section_key: 'agenda', sort_order: 1 },
    { section_key: 'story', sort_order: 999 },
  ])

  assert.equal(ordered[0]?.section_key, 'agenda')
  assert.equal(ordered.at(-1)?.section_key, 'story')
  assert.equal(ordered.length, defaultHomeSectionOrder.length)
})

test('ignores unknown keys and invalid order values', () => {
  const ordered = normalizeHomeSectionOrder([
    { section_key: 'unknown', sort_order: 1 },
    { section_key: 'agenda', sort_order: Number.NaN },
  ])

  assert.deepEqual(ordered, defaultHomeSectionOrder)
})
