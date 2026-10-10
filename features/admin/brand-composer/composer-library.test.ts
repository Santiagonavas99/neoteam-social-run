import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CommunityRecord, LogoItem } from '../types.ts'
import { composerBrands, composerImageSrc } from './composer-library.ts'

const brand = (id: string, name: string, active = true): CommunityRecord => ({
  id,
  name,
  logo_url: `https://example.com/${id}.png`,
  active,
  show_on_home: true,
  sort_order: 1,
  type: 'sponsor',
})
const logo = (id: string, name: string, shown = false): LogoItem => ({
  id,
  name,
  logo_url: `https://example.com/${id}.png`,
  active: true,
  sort_order: 0,
  show_in_organizations: shown,
  show_in_running_crews: false,
})

test('Marcas aliadas includes all active carousel logos regardless of organization flag', () => {
  const logos = Array.from({ length: 17 }, (_, i) => logo(String(i), `Aliado ${i + 1}`))
  const organizer: CommunityRecord = {
    ...brand('neoteam', 'NeoTeam'),
    logo_url: '/neoteam-logo.png',
    type: 'organizer',
  }
  const rows = composerBrands([organizer], logos)
  assert.equal(rows.length, 17)
  assert.equal(rows[0]?.name, 'Aliado 1')
  assert.equal(rows[16]?.name, 'Aliado 17')
  assert.equal(
    rows.some((row) => row.name === 'NeoTeam'),
    false,
  )
  assert.equal(
    rows.every((row) => row.origin === 'logos'),
    true,
  )
})

test('deduplicates by normalized name and prefers original carousel logo', () => {
  const rows = composerBrands(
    [brand('1', 'Café Norte'), brand('2', 'Oculta', false)],
    [logo('3', 'CAFÉ NORTE'), logo('4', 'Marca nueva'), logo('5', 'Solo crew', false)],
  )
  assert.deepEqual(
    rows.map((item) => item.name),
    ['CAFÉ NORTE', 'Marca nueva', 'Solo crew'],
  )
  assert.equal(rows[0]?.origin, 'logos')
  assert.equal(rows[0]?.src, 'https://example.com/3.png')
})

test('does not add hidden or broken brands, but retains valid partner brand records', () => {
  const organizer: CommunityRecord = { ...brand('neo', 'NeoTeam'), type: 'organizer' }
  const missing = { ...brand('missing', 'No foto'), logo_url: null }
  const inactive = { ...logo('bad', 'Inactivo'), active: false }
  const rows = composerBrands([organizer, missing, brand('partner', 'Partner')], [inactive])
  assert.deepEqual(
    rows.map((row) => row.name),
    ['Partner'],
  )
})

test('uses image optimizer only for this project public Supabase assets', () => {
  const url = 'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/logos/test.webp'
  assert.match(composerImageSrc(url), /^\/_next\/image\?url=/)
  assert.equal(composerImageSrc('https://other.example/test.png'), 'https://other.example/test.png')
})
