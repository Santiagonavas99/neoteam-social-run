import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adminUpstreamHeaders } from './admin-proxy.ts'

const request = new Request('https://example.test/api/admin', {
  headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
})

test('refuses to build headers without the proxy secret', () => {
  assert.equal(adminUpstreamHeaders(request, 'key', {}), null)
  assert.equal(adminUpstreamHeaders(request, 'key', { ADMIN_PROXY_SECRET: '  ' }), null)
})

test('always sends the secret and never forwards x-forwarded-for', () => {
  const headers = adminUpstreamHeaders(request, 'key', { ADMIN_PROXY_SECRET: 's3cret' })
  assert.equal(headers?.['x-admin-proxy-secret'], 's3cret')
  assert.equal(headers?.apikey, 'key')
  assert.equal(headers?.['x-forwarded-for'], undefined)
  assert.equal(headers?.['x-admin-client-ip'], undefined)
})

test('sends the first client IP only on Vercel', () => {
  const headers = adminUpstreamHeaders(request, 'key', { ADMIN_PROXY_SECRET: 's', VERCEL: '1' })
  assert.equal(headers?.['x-admin-client-ip'], '203.0.113.7')
})
