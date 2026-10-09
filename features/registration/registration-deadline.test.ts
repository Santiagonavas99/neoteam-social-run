import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  colombiaInputToUtc,
  colombiaLocalInput,
  isRegistrationClosed,
  registrationDeadlineLabel,
} from './registration-deadline.ts'

const open = { registrationOpen: true, deadline: '2026-10-18T01:00:00Z' }

test('Saturday 17 at 8 p.m. Colombia closes at 2026-10-18T01:00:00Z', () => {
  assert.equal(isRegistrationClosed(open, Date.parse('2026-10-18T00:59:59.999Z')), false)
  assert.equal(isRegistrationClosed(open, Date.parse('2026-10-18T01:00:00Z')), true)
  assert.equal(isRegistrationClosed(open, Date.parse('2026-10-18T01:00:01Z')), true)
})

test('manual admin toggle closes or reopens and no deadline stays open', () => {
  assert.equal(isRegistrationClosed({ registrationOpen: false, deadline: null }), true)
  assert.equal(isRegistrationClosed({ registrationOpen: true, deadline: null }), false)
})

test('Colombian inputs round-trip to UTC and reject invalid dates', () => {
  assert.equal(colombiaInputToUtc('2026-10-17T20:00'), '2026-10-18T01:00:00.000Z')
  assert.equal(colombiaLocalInput('2026-10-18T01:00:00Z'), '2026-10-17T20:00')
  assert.equal(colombiaInputToUtc('2026-02-30T20:00'), null)
  assert.equal(colombiaInputToUtc('2026-10-17T25:00'), null)
  assert.equal(colombiaInputToUtc('bad'), null)
})

test('deadline label includes date and uses Colombia timezone', () => {
  const label = registrationDeadlineLabel(open.deadline)
  assert.match(label, /17/)
  assert.match(label.toLowerCase(), /octubre/)
})
