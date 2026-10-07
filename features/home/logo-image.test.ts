import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isOptimizable } from './logo-image.ts'

test('only optimizes logos from the project public Storage', () => {
  assert.equal(
    isOptimizable(
      'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/admin-media/a.jpg',
    ),
    true,
  )
  assert.equal(isOptimizable('https://example.com/logo.png'), false)
  assert.equal(
    isOptimizable('https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/sign/x.png'),
    false,
  )
  assert.equal(
    isOptimizable(
      'https://ohatsnkgaeccltqwhkbv.supabase.co.evil.com/storage/v1/object/public/a.png',
    ),
    false,
  )
})
