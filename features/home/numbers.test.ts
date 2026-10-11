import assert from 'node:assert/strict'
import test from 'node:test'
import { countUpValue, runnersShown } from './numbers.ts'

test('runner count stays at 80 until real registrations exceed 80', () => {
  for (const count of [0, 3, 50, 79, 80]) {
    assert.equal(runnersShown(count), 80, `real registrations: ${count}`)
  }
  assert.equal(runnersShown(81), 81)
  assert.equal(runnersShown(100), 100)
})

test('runner count stays visible at 80 if aggregate RPC is unavailable', () => {
  assert.equal(runnersShown(null), 80)
})

test('count-up runs from 0 to the target and clamps', () => {
  assert.equal(countUpValue(23, 0), 0)
  assert.equal(countUpValue(23, 1), 23)
  assert.equal(countUpValue(23, 2), 23)
  assert.equal(countUpValue(23, -1), 0)
  assert.ok(countUpValue(100, 0.5) > 50, 'ease-out is past halfway at half time')
})
