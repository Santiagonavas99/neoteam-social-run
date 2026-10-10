import assert from 'node:assert/strict'
import { test } from 'node:test'
import { composerImageSrc, safePublicComposerImageUrl } from './composer-image-source.ts'

const logo =
  'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/admin-media/logo.webp'

test('public NeoTeam logos use a same-origin image proxy for Canvas and exports', () => {
  assert.equal(safePublicComposerImageUrl(logo), logo)
  assert.equal(composerImageSrc(logo), `/api/composer-image?src=${encodeURIComponent(logo)}`)
})

test('refuses private, foreign and malformed image proxy URLs', () => {
  const invalid = [
    'http://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/admin-media/a.webp',
    'https://another.example/admin-media/a.webp',
    'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/sign/a.webp',
    'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/file.svg',
    'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/file.webp?download=true',
    'https://ohatsnkgaeccltqwhkbv.supabase.co.evil.example/storage/v1/object/public/a.webp',
    'file:///etc/passwd',
    'javascript:alert(1)',
    '',
  ]
  for (const url of invalid) assert.equal(safePublicComposerImageUrl(url), null, url)
  assert.equal(composerImageSrc('blob:preview'), 'blob:preview')
  assert.equal(composerImageSrc('https://other.example/logo.png'), 'https://other.example/logo.png')
})
