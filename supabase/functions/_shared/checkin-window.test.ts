import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isCheckinClosed, SR26_CHECKIN_CLOSES_AT } from './checkin-window.ts'

test('SR26 check-in closes exactly on Sunday 18 October at 10:00 Colombia', () => {
  assert.equal(SR26_CHECKIN_CLOSES_AT, '2026-10-18T15:00:00.000Z')
  assert.equal(isCheckinClosed(Date.parse('2026-10-18T14:59:59.999Z')), false)
  assert.equal(isCheckinClosed(Date.parse('2026-10-18T15:00:00.000Z')), true)
  assert.equal(isCheckinClosed(Date.parse('2026-10-18T15:00:00.001Z')), true)
})
