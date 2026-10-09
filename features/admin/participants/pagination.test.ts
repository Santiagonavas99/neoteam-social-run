import assert from 'node:assert/strict'
import test from 'node:test'
import { pageCorrection } from './pagination.ts'

test('next page is never reset by a stale page-one response', () => {
  assert.equal(pageCorrection(2, 1, 1), null)
  assert.equal(pageCorrection(3, 2, 2), null)
})

test('a current response with the requested page never forces a state update', () => {
  assert.equal(pageCorrection(2, 2, 2), null)
  assert.equal(pageCorrection(1, 1, 1), null)
})

test('a current response can clamp out-of-bounds pages after changes in totals', () => {
  assert.equal(pageCorrection(4, 4, 3), 3)
  assert.equal(pageCorrection(2, 2, 1), 1)
})

test('changing filters back to first page is not undone by a stale response', () => {
  assert.equal(pageCorrection(1, 3, 3), null)
})
