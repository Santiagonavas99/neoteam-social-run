import assert from 'node:assert/strict'
import { test } from 'node:test'
import { passQrDataUrl } from './qr.ts'

const token = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b'

test('renders the pass QR as a stable SVG data URL', () => {
  const url = passQrDataUrl(token)
  assert.ok(url.startsWith('data:image/svg+xml;base64,'))
  assert.match(Buffer.from(url.split(',')[1] ?? '', 'base64').toString(), /^<svg/)
  assert.equal(passQrDataUrl(token), url)
  assert.notEqual(passQrDataUrl(token.replace('6', '7')), url)
})
