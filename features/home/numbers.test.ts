import assert from 'node:assert/strict'
import test from 'node:test'
import { countUpValue, runnersShown } from './numbers.ts'

test('runners start at the baseline of 20', () => {
  assert.equal(runnersShown(0), 20)
  assert.equal(runnersShown(3), 23)
})

test('count-up runs from 0 to the target and clamps', () => {
  assert.equal(countUpValue(23, 0), 0)
  assert.equal(countUpValue(23, 1), 23)
  assert.equal(countUpValue(23, 2), 23)
  assert.equal(countUpValue(23, -1), 0)
  assert.ok(countUpValue(100, 0.5) > 50, 'ease-out is past halfway at half time')
})
