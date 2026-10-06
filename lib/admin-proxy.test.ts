import assert from 'node:assert/strict'
import { test } from 'node:test'
import { gzipSync } from 'node:zlib'
import { adminUpstreamHeaders, parseAdminBody } from './admin-proxy.ts'

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

const post = (body: BodyInit, headers: Record<string, string> = {}) =>
  new Request('https://example.test/api/admin', { method: 'POST', body, headers })

test('parses a JSON object with a string action', async () => {
  assert.deepEqual(await parseAdminBody(post('{"action":"login","pin":"123456"}')), {
    action: 'login',
    pin: '123456',
  })
})

test('rejects bodies without a string action, arrays and invalid JSON', async () => {
  assert.equal(await parseAdminBody(post('{"pin":"123456"}')), null)
  assert.equal(await parseAdminBody(post('{"action":1}')), null)
  assert.equal(await parseAdminBody(post('[{"action":"login"}]')), null)
  assert.equal(await parseAdminBody(post('{not json')), null)
})

test('accepts a gzip body and rejects one that expands past the cap', async () => {
  const small = gzipSync(JSON.stringify({ action: 'uploadAdminImage', data: 'x'.repeat(1000) }))
  assert.equal(
    (await parseAdminBody(post(small, { 'content-encoding': 'gzip' })))?.action,
    'uploadAdminImage',
  )

  const bomb = gzipSync(JSON.stringify({ action: 'x', data: 'a'.repeat(7 * 1024 * 1024) }))
  assert.ok(bomb.length < 100_000)
  assert.equal(await parseAdminBody(post(bomb, { 'content-encoding': 'gzip' })), null)
})
