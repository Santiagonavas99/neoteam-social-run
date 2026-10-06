import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatTime } from './datetime.ts'

test('formats times in Colombia time', () => {
  assert.equal(formatTime('2026-10-18T12:41:00Z').replace(/\s/g, ' '), '7:41 a. m.')
})
