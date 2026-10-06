import assert from 'node:assert/strict'
import { test } from 'node:test'
import { percentToProbability, probabilityToPercent } from './probability.ts'

test('converts between the form percent and the stored probability', () => {
  assert.equal(percentToProbability(25), 0.25)
  assert.equal(probabilityToPercent(0.25), 25)
  assert.equal(probabilityToPercent(percentToProbability(7)), 7)
})

test('clamps out-of-range values', () => {
  assert.equal(percentToProbability(150), 1)
  assert.equal(percentToProbability(-5), 0)
  assert.equal(probabilityToPercent(2), 100)
  assert.equal(probabilityToPercent(-1), 0)
})

test('treats NaN as zero', () => {
  assert.equal(percentToProbability(Number.NaN), 0)
  assert.equal(probabilityToPercent(Number.NaN), 0)
})
