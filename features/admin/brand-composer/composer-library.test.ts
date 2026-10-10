import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CommunityRecord, LogoItem } from '../types.ts'
import { composerBrands, composerImageSrc } from './composer-library.ts'

const brand = (id: string, name: string, active = true): CommunityRecord => ({
  id, name, logo_url: `https://example.com/${id}.png`, active, show_on_home: true, sort_order: 1,
})
const logo = (id: string, name: string, shown = true): LogoItem => ({
  id, name, logo_url: `https://example.com/${id}.png`, active: true, sort_order: 0,
  show_in_organizations: shown, show_in_running_crews: false,
})

test('combines visible brands and allied carousel logos without duplicate names', () => {
  const rows = composerBrands(
    [brand('1', 'Café Norte'), brand('2', 'Oculta', false)],
    [logo('3', 'CAFÉ NORTE'), logo('4', 'Marca nueva'), logo('5', 'Solo crew', false)],
  )
  assert.deepEqual(rows.map((item) => item.name), ['Café Norte', 'Marca nueva'])
  assert.equal(rows[0].origin, 'brands')
  assert.equal(rows[1].origin, 'logos')
})

test('uses image optimizer only for this project public Supabase assets', () => {
  const url = 'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/logos/test.webp'
  assert.match(composerImageSrc(url), /^\/_next\/image\?url=/)
  assert.equal(composerImageSrc('https://other.example/test.png'), 'https://other.example/test.png')
})
