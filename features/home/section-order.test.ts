import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultHomeSectionOrder, normalizeHomeSectionOrder } from './section-order.ts'

test('uses the editorial default order when no rows are stored', () => {
  assert.deepEqual(normalizeHomeSectionOrder([]), defaultHomeSectionOrder)
})

test('uses saved numeric order and fills missing sections from defaults', () => {
  const ordered = normalizeHomeSectionOrder([
    { section_key: 'agenda', sort_order: 1, visible: true },
    { section_key: 'story', sort_order: 999, visible: true },
  ])

  assert.equal(ordered[0]?.section_key, 'agenda')
  assert.equal(ordered.at(-1)?.section_key, 'story')
  assert.equal(ordered.length, defaultHomeSectionOrder.length)
})

test('keeps a hidden section in its position so it can be restored later', () => {
  const ordered = normalizeHomeSectionOrder([
    { section_key: 'agenda', sort_order: 2, visible: false },
  ])

  const agenda = ordered.find((section) => section.section_key === 'agenda')
  assert.equal(agenda?.sort_order, 2)
  assert.equal(agenda?.visible, false)
})

test('defaults stored rows without visibility to visible', () => {
  const ordered = normalizeHomeSectionOrder([{ section_key: 'agenda', sort_order: 1 }])
  assert.equal(ordered[0]?.section_key, 'agenda')
  assert.equal(ordered[0]?.visible, true)
})

test('ignores unknown keys and invalid order values', () => {
  const ordered = normalizeHomeSectionOrder([
    { section_key: 'unknown', sort_order: 1, visible: false },
    { section_key: 'agenda', sort_order: Number.NaN, visible: false },
  ])

  assert.deepEqual(ordered, defaultHomeSectionOrder)
})
