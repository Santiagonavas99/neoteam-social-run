import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DynamicRow } from '../types'
import { filterMobileDynamics, phaseForStatus } from './mobile-dynamics'

const row = (name: string, type: DynamicRow['type'], status: DynamicRow['status']): DynamicRow => ({
  id: name,
  name,
  type,
  status,
  points: 0,
  winner_count: 1,
  requires_checkin: true,
})

test('mobile phases work across all types and preserve completed history', () => {
  const rows = [
    row('Sorteo', 'raffle', 'open'),
    row('Planchas', 'challenge', 'open'),
    row('Trivia', 'trivia', 'draft'),
    row('Ruleta', 'instant_win', 'completed'),
    row('Relevo', 'challenge', 'closed'),
    row('Cancelada', 'raffle', 'cancelled'),
  ]
  assert.deepEqual(
    filterMobileDynamics(rows, 'en-vivo', '').map((item) => item.name),
    ['Sorteo', 'Planchas'],
  )
  assert.deepEqual(
    filterMobileDynamics(rows, 'preparar', '').map((item) => item.name),
    ['Trivia'],
  )
  assert.equal(filterMobileDynamics(rows, 'resultados', '').length, 3)
  assert.deepEqual(
    filterMobileDynamics(rows, 'en-vivo', 'planchas').map((item) => item.name),
    ['Planchas'],
  )
  assert.equal(phaseForStatus('completed'), 'resultados')
})
