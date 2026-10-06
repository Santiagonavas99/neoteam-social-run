import assert from 'node:assert/strict'
import { test } from 'node:test'
import { matchesQuery } from './filter.ts'

test('matches any field, ignoring case and missing values', () => {
  const fields = ['Ana', null, 'SR26-00001', undefined, 'NeoTeam']
  assert.ok(matchesQuery(fields, ''))
  assert.ok(matchesQuery(fields, 'sr26-00001'))
  assert.ok(matchesQuery(fields, 'neot'))
  assert.ok(!matchesQuery(fields, 'luis'))
})
