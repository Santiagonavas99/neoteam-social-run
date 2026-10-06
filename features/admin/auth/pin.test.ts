import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isPin, normalizePin } from './pin.ts'

test('normalizePin keeps at most six digits', () => {
  assert.equal(normalizePin('12a3 45-678'), '123456')
  assert.equal(normalizePin('abc'), '')
})

test('isPin accepts exactly six digits', () => {
  assert.ok(isPin('012345'))
  assert.ok(!isPin('12345'))
  assert.ok(!isPin('1234567'))
  assert.ok(!isPin('12345a'))
})
