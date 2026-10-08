import assert from 'node:assert/strict'
import test from 'node:test'
import { countUpValue, runnersShown } from './numbers.ts'

test('runner count stays at 50 until real registrations exceed 50', () => {
  for (const count of [0, 3, 30, 31, 49, 50]) {
    assert.equal(runnersShown(count), 50, `real registrations: ${count}`)
  }
  assert.equal(runnersShown(51), 51)
  assert.equal(runnersShown(75), 75)
  assert.equal(runnersShown(100), 100)
})

test('runner count stays visible at 50 if aggregate RPC is unavailable', () => {
  assert.equal(runnersShown(null), 50)
})

test('count-up runs from 0 to the target and clamps', () => {
  assert.equal(countUpValue(23, 0), 0)
  assert.equal(countUpValue(23, 1), 23)
  assert.equal(countUpValue(23, 2), 23)
  assert.equal(countUpValue(23, -1), 0)
  assert.ok(countUpValue(100, 0.5) > 50, 'ease-out is past halfway at half time')
})
