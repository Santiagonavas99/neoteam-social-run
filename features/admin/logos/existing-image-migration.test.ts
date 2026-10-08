import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canPreserveSlug, expectedSlug, isExistingStoredImage } from './migration-guards.ts'

const base = 'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/admin-media/'

test('accepts only project-owned PNG and JPEG uploads, never WebP or external URLs', () => {
  assert.equal(isExistingStoredImage(`${base}photo.png`), true)
  assert.equal(isExistingStoredImage(`${base}photo.jpg`), true)
  assert.equal(isExistingStoredImage(`${base}photo.jpeg`), true)
  assert.equal(isExistingStoredImage(`${base}photo.webp`), false)
  assert.equal(
    isExistingStoredImage('https://example.com/storage/v1/object/public/admin-media/a.jpg'),
    false,
  )
  assert.equal(isExistingStoredImage('/neoteam-logo.png'), false)
  assert.equal(isExistingStoredImage(null), false)
})

test('does not migrate signed, altered or unexpected storage paths', () => {
  assert.equal(isExistingStoredImage(`${base}a.png?token=123`), false)
  assert.equal(isExistingStoredImage(`${base}a.jpg#fragment`), false)
  assert.equal(isExistingStoredImage(`${base}subfolder/a.jpg`), false)
  assert.equal(isExistingStoredImage(`${base}a.svg`), false)
})

test('matches backend slug normalization exactly before changing community logos', () => {
  assert.equal(expectedSlug('Pacífico Running Club'), 'pacifico-running-club')
  assert.equal(expectedSlug('Run 365'), 'run-365')
  assert.equal(
    canPreserveSlug({
      id: '1',
      name: 'Run 365',
      slug: 'run-365',
      active: true,
      show_on_home: true,
      sort_order: 1,
    }),
    true,
  )
  assert.equal(
    canPreserveSlug({
      id: '1',
      name: 'Run 365',
      slug: 'legacy-id',
      active: true,
      show_on_home: true,
      sort_order: 1,
    }),
    false,
  )
})
