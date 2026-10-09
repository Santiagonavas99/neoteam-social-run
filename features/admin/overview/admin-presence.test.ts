import assert from 'node:assert/strict'
import test from 'node:test'
import {
  activityLabel,
  isPresenceCurrent,
  PRESENCE_EXPIRY_MS,
  PRESENCE_IDLE_MS,
} from './admin-presence.ts'

const now = Date.parse('2026-10-09T17:00:00.000Z')
const ago = (ms: number) => new Date(now - ms).toISOString()

test('only a fresh heartbeat and recent interaction count as connected', () => {
  assert.equal(isPresenceCurrent(ago(25_000), ago(50_000), now), true)
  assert.equal(isPresenceCurrent(ago(PRESENCE_EXPIRY_MS), ago(50_000), now), false)
  assert.equal(isPresenceCurrent(ago(25_000), ago(PRESENCE_IDLE_MS), now), false)
})

test('invalid and future timestamps cannot appear as live', () => {
  assert.equal(isPresenceCurrent('invalid', ago(30_000), now), false)
  assert.equal(isPresenceCurrent(ago(20_000), 'nope', now), false)
  assert.equal(isPresenceCurrent(new Date(now + 100_000).toISOString(), ago(10_000), now), false)
})

test('last activity is shown with human-readable approximate times', () => {
  assert.equal(activityLabel(ago(35_000), now), 'Activo hace menos de 1 min')
  assert.equal(activityLabel(ago(75_000), now), 'Activo hace 1 min')
  assert.equal(activityLabel(ago(119_000), now), 'Activo hace 1 min')
})
