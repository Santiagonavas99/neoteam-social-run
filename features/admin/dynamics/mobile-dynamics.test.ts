import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DynamicRow } from '../types'
import { sortMobileDynamics } from './mobile-dynamics.ts'

const row = (name: string, type: DynamicRow['type'], status: DynamicRow['status']): DynamicRow => ({
  id: name,
  name,
  type,
  status,
  points: 0,
  winner_count: 1,
  requires_checkin: true,
})

test('one mobile list shows all activities with active first and preserves history', () => {
  const rows = [
    row('Premio anterior', 'raffle', 'completed'),
    row('Planchas', 'challenge', 'open'),
    row('Trivia nueva', 'trivia', 'draft'),
    row('Sorteo activo', 'raffle', 'open'),
    row('Stand pasado', 'qr', 'closed'),
    row('Cancelada', 'raffle', 'cancelled'),
  ]
  const sorted = sortMobileDynamics(rows, '')
  assert.deepEqual(sorted.map((entry) => entry.status), [
    'open', 'open', 'draft', 'completed', 'closed', 'cancelled',
  ])
  assert.deepEqual(sortMobileDynamics(rows, 'planchas').map((entry) => entry.name), ['Planchas'])
  assert.equal(rows[0]?.status, 'completed')
})
