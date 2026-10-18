import assert from 'node:assert/strict'
import { test } from 'node:test'
import { shouldRequestCheckinException } from './checkin-deadline.ts'

test('normal check-in turns into a reasoned admin exception at the Colombian cutoff', () => {
  const before = Date.parse('2026-10-18T14:59:59.999Z')
  const cutoff = Date.parse('2026-10-18T15:00:00.000Z')
  assert.equal(shouldRequestCheckinException('checked_in', before), false)
  assert.equal(shouldRequestCheckinException('checked_in', cutoff), true)
  assert.equal(shouldRequestCheckinException('checked_in', cutoff + 1), true)
  assert.equal(shouldRequestCheckinException('registered', cutoff), false)
  assert.equal(shouldRequestCheckinException('cancelled', cutoff), false)
})
