import assert from 'node:assert/strict'
import { test } from 'node:test'
import { countdown } from './countdown.ts'

const start = Date.parse('2026-10-18T07:30:00-05:00')
const end = Date.parse('2026-10-18T11:00:00-05:00')

test('one second before the start', () => {
  assert.deepEqual(countdown(start - 1000, start, end), {
    state: 'upcoming',
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 1,
  })
})

test('splits days, hours, minutes and seconds', () => {
  const now = start - ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000
  assert.deepEqual(countdown(now, start, end), {
    state: 'upcoming',
    days: 2,
    hours: 3,
    minutes: 4,
    seconds: 5,
  })
})

test('rounds a partial second up, so it never shows 0 before the start', () => {
  assert.deepEqual(countdown(start - 200, start, end), {
    state: 'upcoming',
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 1,
  })
})

test('live from the start until one millisecond before the end', () => {
  assert.deepEqual(countdown(start, start, end), { state: 'live' })
  assert.deepEqual(countdown(end - 1, start, end), { state: 'live' })
})

test('ended at the end', () => {
  assert.deepEqual(countdown(end, start, end), { state: 'ended' })
})
