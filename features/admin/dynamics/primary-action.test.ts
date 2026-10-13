import assert from 'node:assert/strict'
import { test } from 'node:test'
import { gamePrimaryAction } from './primary-action.ts'

test('the control panel presents only one contextual primary action', () => {
  assert.equal(gamePrimaryAction('draft', null, 3), null)
  assert.equal(gamePrimaryAction('open', { phase: 'ready', shown_count: 0 }, 3), 'countdown')
  assert.equal(gamePrimaryAction('open', { phase: 'countdown', shown_count: 0 }, 3), 'draw')
  assert.equal(gamePrimaryAction('completed', { phase: 'ready', shown_count: 0 }, 3), 'prepare')
  assert.equal(gamePrimaryAction('completed', { phase: 'reveal', shown_count: 0 }, 3), 'next')
  assert.equal(gamePrimaryAction('completed', { phase: 'reveal', shown_count: 2 }, 3), 'next')
  assert.equal(gamePrimaryAction('completed', { phase: 'reveal', shown_count: 3 }, 3), 'finish')
  assert.equal(gamePrimaryAction('completed', { phase: 'finished', shown_count: 3 }, 3), null)
  assert.equal(gamePrimaryAction('cancelled', null, 3), null)
})
