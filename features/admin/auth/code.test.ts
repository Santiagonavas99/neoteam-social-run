import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isEmail, normalizeEmail } from './code.ts'

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
