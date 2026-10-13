import assert from 'node:assert/strict'
import { test } from 'node:test'
import { countdownValue, demoGame, isGameId } from './game-state.ts'

test('public game paths require a UUID', () => {
  assert.equal(isGameId('22222222-2222-4222-8222-222222222222'), true)
  assert.equal(isGameId('demo'), false)
  assert.equal(isGameId('../admin'), false)
})

test('countdown is derived from the stage timestamp', () => {
  const start = Date.parse('2026-10-09T12:00:00Z')
  assert.equal(countdownValue(new Date(start).toISOString(), start), 3)
  assert.equal(countdownValue(new Date(start).toISOString(), start + 1000), 2)
  assert.equal(countdownValue(new Date(start).toISOString(), start + 3000), 0)
})

test('demo uses fictional names only', () => {
  assert.deepEqual(
    demoGame.winners.map((w) => w.rank),
    [1, 2, 3],
  )
  assert.deepEqual(
    demoGame.winners.map((w) => w.name),
    ['Participante de prueba 1', 'Participante de prueba 2', 'Participante de prueba 3'],
  )
})
