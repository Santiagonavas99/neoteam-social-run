import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CommunityRecord, DynamicRow, LogoItem } from '../types'
import { dynamicSponsorOptions, dynamicSponsorValue, sponsorFields } from './dynamic-sponsors.ts'

const logo = (id: string, name: string, active = true): LogoItem => ({
  id, name, active, sort_order: 0, logo_url: 'https://example.com/logo.webp',
  show_in_races: false, show_in_running_crews: false, show_in_organizations: false,
})
const brand = (id: string, name: string, type = 'sponsor'): CommunityRecord => ({
  id, name, active: true, show_on_home: true, sort_order: 0, type,
})

test('active allied logos take priority over legacy duplicates', () => {
  assert.deepEqual(
    dynamicSponsorOptions(
      [brand('b1', 'Café Águila'), brand('b2', 'Otra marca'), brand('b3', 'NeoTeam', 'organizer')],
      [logo('l1', 'Cafe Aguila'), logo('l2', 'Oculta', false)],
    ),
    [{ value: 'logo:l1', name: 'Cafe Aguila' }, { value: 'brand:b2', name: 'Otra marca' }],
  )
})

test('a previously selected legacy sponsor stays visible despite name collision', () => {
  const options = dynamicSponsorOptions(
    [brand('old', 'Marca aliada')], [logo('new', 'Marca aliada')], 'brand:old',
  )
  assert.deepEqual(options.map((item) => item.value), ['logo:new', 'brand:old'])
})

test('logo-backed sponsors are stored in config without invalid brand FK values', () => {
  const selected = sponsorFields('logo:logo-id', { gender: 'male' })
  assert.deepEqual(selected, {
    sponsor_brand_id: null, config: { gender: 'male', sponsor_logo_id: 'logo-id' },
  })
  assert.equal(dynamicSponsorValue(selected), 'logo:logo-id')
  const legacy = sponsorFields('brand:brand-id', selected.config)
  assert.deepEqual(legacy, { sponsor_brand_id: 'brand-id', config: { gender: 'male' } })
  assert.equal(dynamicSponsorValue(legacy), 'brand:brand-id')
  assert.deepEqual(sponsorFields('', selected.config), {
    sponsor_brand_id: null, config: { gender: 'male' },
  })
})

test('previously stored legacy sponsor IDs still load', () => {
  const row: DynamicRow = {
    id: 'old', name: 'Rifa', type: 'raffle', status: 'completed',
    winner_count: 1, points: 0, requires_checkin: true, sponsor_brand_id: 'original',
  }
  assert.equal(dynamicSponsorValue(row), 'brand:original')
})
