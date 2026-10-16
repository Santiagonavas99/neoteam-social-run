import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DynamicRow } from '../types'
import { duplicateDynamic } from './duplicate-dynamic.ts'

test('repeating a completed dynamic copies editable rules into an independent draft', () => {
  const original: DynamicRow = {
    id: 'old', name: 'Gran rifa final', description: 'Premio', type: 'raffle',
    status: 'completed', sponsor_brand_id: null, prize: 'Camiseta',
    winner_count: 2, points: 0, requires_checkin: true,
    eligibility_dynamic_id: 'previous-challenge',
    config: { exclude_winners: true, sponsor_logo_id: 'ally-logo' },
    participations_count: 350, winners_count: 2,
  }
  const repeat = duplicateDynamic(original)
  assert.ok(repeat.id.startsWith('new-'))
  assert.notEqual(repeat.id, original.id)
  assert.equal(repeat.status, 'draft')
  assert.equal(repeat.name, 'Gran rifa final (copia)')
  assert.equal(repeat.eligibility_dynamic_id, null)
  assert.equal(repeat.participations_count, undefined)
  assert.equal(repeat.winners_count, undefined)
  assert.deepEqual(repeat.config, original.config)
  assert.notEqual(repeat.config, original.config)
  assert.equal(original.status, 'completed')
  assert.equal(original.eligibility_dynamic_id, 'previous-challenge')
})
