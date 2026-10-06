import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isUsername, normalizeUsername } from './username.ts'

test('normalizeUsername trims and lowercases', () => {
  assert.equal(normalizeUsername('  Ana.Run '), 'ana.run')
})

test('isUsername accepts 3 to 32 of a-z, 0-9, dot, underscore and dash', () => {
  assert.ok(isUsername('ana'))
  assert.ok(isUsername('Puerta_2-norte'))
  assert.ok(!isUsername('an'))
  assert.ok(!isUsername('ana maria'))
  assert.ok(!isUsername('añá'))
  assert.ok(!isUsername('a'.repeat(33)))
})
