import assert from 'node:assert/strict'
import { test } from 'node:test'
import { landingRegistrationState } from './landing-registration-state.ts'

const beforeDeadline = Date.parse('2026-10-18T00:59:59Z')
const atDeadline = Date.parse('2026-10-18T01:00:00Z')
const settings = { registrationOpen: true, deadline: '2026-10-18T01:00:00Z' }

test('landing is open until deadline, then closes exactly at the configured instant', () => {
  assert.equal(landingRegistrationState(settings, beforeDeadline), 'open')
  assert.equal(landingRegistrationState(settings, atDeadline), 'closed')
})

test('manual admin closure disables landing calls to register immediately', () => {
  assert.equal(landingRegistrationState({ ...settings, registrationOpen: false }, beforeDeadline), 'closed')
  assert.equal(landingRegistrationState({ ...settings, registrationOpen: true }, beforeDeadline), 'open')
})

test('uncertain backend status never advertises an active registration', () => {
  assert.equal(landingRegistrationState(null, beforeDeadline), 'unavailable')
  assert.equal(landingRegistrationState({ registrationOpen: true, deadline: null }, beforeDeadline), 'open')
})
