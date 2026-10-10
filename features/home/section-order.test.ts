import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultHomeSectionOrder, normalizeHomeSectionOrder } from './section-order.ts'

test('includes event steps after the event introduction by default', () => {
  const keys = normalizeHomeSectionOrder([]).map((section) => section.section_key)
  assert.ok(keys.indexOf('steps') > keys.indexOf('story'))
  assert.ok(keys.indexOf('steps') < keys.indexOf('agenda'))
  assert.equal(
    normalizeHomeSectionOrder([]).find((row) => row.section_key === 'steps')?.visible,
    true,
  )
})

test('supports hiding and reordering the steps independently', () => {
  const result = normalizeHomeSectionOrder([
    { section_key: 'steps', sort_order: 999, visible: false },
  ])
  assert.equal(result.at(-1)?.section_key, 'steps')
  assert.equal(result.at(-1)?.visible, false)
})

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
  const agenda = ordered.find((section) => section.section_key === 'agenda')
  assert.equal(agenda?.visible, true)
})

test('includes Landak Studio as a visible configurable section by default', () => {
  const landak = normalizeHomeSectionOrder([]).find(
    (section) => section.section_key === 'landak_studio',
  )
  assert.equal(landak?.visible, true)
  assert.equal(landak?.sort_order, 10)
})

test('ignores unknown keys and invalid order values', () => {
  const ordered = normalizeHomeSectionOrder([
    { section_key: 'unknown', sort_order: 1, visible: false },
    { section_key: 'agenda', sort_order: Number.NaN, visible: false },
  ])

  assert.deepEqual(ordered, defaultHomeSectionOrder)
})

test('places allied races after allied brands by default, with independent visibility', () => {
  const sections = normalizeHomeSectionOrder([])
  const keys = sections.map((row) => row.section_key)
  assert.equal(keys.indexOf('races'), keys.indexOf('allies') + 1)
  assert.equal(keys.indexOf('running_crews'), keys.indexOf('races') + 1)

  const hidden = normalizeHomeSectionOrder([
    { section_key: 'races', sort_order: 12, visible: false },
  ])
  assert.equal(hidden.find((row) => row.section_key === 'races')?.visible, false)
  assert.equal(hidden.at(-1)?.section_key, 'races')
})
