import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isCode, isEmail, normalizeCode, normalizeEmail } from './code.ts'

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

test('normalizeEmail trims and lowercases', () => {
  assert.equal(normalizeEmail('  Ana@Example.COM '), 'ana@example.com')
})

test('isEmail accepts a plain address and rejects the rest', () => {
  assert.ok(isEmail('ana@example.com'))
  assert.ok(isEmail(' Ana@Example.com '))
  assert.ok(!isEmail('ana@example'))
  assert.ok(!isEmail('ana example@x.com'))
  assert.ok(!isEmail(`${'a'.repeat(160)}@x.com`))
})
