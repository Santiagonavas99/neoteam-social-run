import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isCode, normalizeCode } from './code.ts'

test('normalizeCode keeps at most six digits', () => {
  assert.equal(normalizeCode('12a3 45-678'), '123456')
  assert.equal(normalizeCode('abc'), '')
})

test('isCode accepts exactly six digits', () => {
  assert.ok(isCode('012345'))
  assert.ok(!isCode('12345'))
  assert.ok(!isCode('1234567'))
  assert.ok(!isCode('12345a'))
})
