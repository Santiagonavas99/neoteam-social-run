import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DynamicRow } from '../types'
import { challengeNeedsRules, groupDynamicsByPhase, orderDynamicsByStatus } from './dynamics-order.ts'

function row(id: string, status: DynamicRow['status']): DynamicRow {
  return {
    id,
    name: id,
    type: 'raffle',
    status,
    winner_count: 1,
    points: 0,
    requires_checkin: false,
  }
}

test('active dynamics appear first and stable sorting preserves server order', () => {
  const original = [
    row('a', 'draft'),
    row('b', 'open'),
    row('c', 'completed'),
    row('d', 'open'),
    row('e', 'closed'),
  ]
  assert.deepEqual(
    orderDynamicsByStatus(original).map(({ id }) => id),
    ['b', 'd', 'a', 'c', 'e'],
  )
  assert.deepEqual(
    original.map(({ id }) => id),
    ['a', 'b', 'c', 'd', 'e'],
  )
})

test('a challenge without clear instructions must be configured before activation', () => {
  assert.equal(challengeNeedsRules({ type: 'challenge', description: 'Corre' }), true)
  assert.equal(
    challengeNeedsRules({ type: 'challenge', description: 'Completa el circuito de 200 m' }),
    false,
  )
  assert.equal(challengeNeedsRules({ type: 'raffle', description: '' }), false)
})

test('status sections are ordered and never duplicate a dynamic', () => {
  const rows = [row('done', 'completed'), row('draft', 'draft'), row('open', 'open'), row('closed', 'closed')]
  const groups = groupDynamicsByPhase(orderDynamicsByStatus(rows))
  assert.deepEqual(groups.map((group) => [group.id, group.rows.map((item) => item.id)]), [
    ['open', ['open']],
    ['draft', ['draft']],
    ['finished', ['done', 'closed']],
  ])
  assert.deepEqual(groupDynamicsByPhase([]), [])
})
