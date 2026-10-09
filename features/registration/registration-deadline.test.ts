import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isRegistrationClosed, REGISTRATION_DEADLINE_ISO } from './registration-deadline.ts'

test('closes at exactly 8 p.m. Colombia time on Saturday 10 October 2026', () => {
  assert.equal(REGISTRATION_DEADLINE_ISO, '2026-10-10T20:00:00-05:00')
  assert.equal(isRegistrationClosed(Date.parse('2026-10-11T00:59:59.999Z')), false)
  assert.equal(isRegistrationClosed(Date.parse('2026-10-11T01:00:00Z')), true)
  assert.equal(isRegistrationClosed(Date.parse('2026-10-11T01:00:01Z')), true)
})
