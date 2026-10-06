import assert from 'node:assert/strict'
import { test } from 'node:test'
import { errorMessage } from './errors.ts'

test('uses the error message, or the fallback for anything else', () => {
  assert.equal(errorMessage(new Error('PIN incorrecto.')), 'PIN incorrecto.')
  assert.equal(errorMessage('boom', 'No pudimos guardar.'), 'No pudimos guardar.')
  assert.equal(errorMessage(null), 'No pudimos completar la operación. Inténtalo de nuevo.')
})
