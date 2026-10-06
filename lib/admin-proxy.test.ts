import assert from 'node:assert/strict'
import { test } from 'node:test'
import { gzipSync } from 'node:zlib'
import { adminUpstreamHeaders, parseAdminBody, proxyToEdgeFunction } from './admin-proxy.ts'

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

const env = {
  SUPABASE_URL: 'https://db.test/',
  SUPABASE_PUBLISHABLE_KEY: 'pk',
  ADMIN_PROXY_SECRET: 's',
}
const copy = 'Sin conexión.'

async function proxy(
  upstream: () => Promise<Response>,
  body: BodyInit = '{"action":"status"}',
  overrides: Record<string, string | undefined> = {},
) {
  const calls: string[] = []
  const original = globalThis.fetch
  const originalError = console.error
  globalThis.fetch = (input) => {
    calls.push(String(input))
    return upstream()
  }
  console.error = () => {}
  try {
    const response = await proxyToEdgeFunction(post(body), 'admin-pin', copy, {
      ...env,
      ...overrides,
    })
    return { status: response.status, data: await response.json(), calls, response }
  } finally {
    globalThis.fetch = original
    console.error = originalError
  }
}

const ok = () => Promise.resolve(Response.json({ ok: true }))

test('proxy answers 503 without URL, key or proxy secret, and never calls upstream', async () => {
  for (const missing of ['SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'ADMIN_PROXY_SECRET']) {
    const result = await proxy(ok, undefined, { [missing]: undefined })
    assert.equal(result.status, 503)
    assert.deepEqual(result.data, { error: copy })
    assert.equal(result.calls.length, 0)
  }
})

test('proxy answers 400 to a body without action', async () => {
  const result = await proxy(ok, '{"pin":"1"}')
  assert.equal(result.status, 400)
  assert.equal(result.calls.length, 0)
})

test('proxy forwards to the named function and passes 2xx/4xx through, uncached', async () => {
  const result = await proxy(() =>
    Promise.resolve(Response.json({ error: 'PIN' }, { status: 401 })),
  )
  assert.deepEqual(result.calls, ['https://db.test/functions/v1/admin-pin'])
  assert.equal(result.status, 401)
  assert.deepEqual(result.data, { error: 'PIN' })
  assert.equal(result.response.headers.get('cache-control'), 'no-store')
})

test('proxy hides upstream 5xx, network failures and non-JSON answers', async () => {
  const failures = [
    () => Promise.resolve(Response.json({ error: 'stack trace' }, { status: 500 })),
    () => Promise.reject(new Error('network')),
    () => Promise.resolve(new Response('<html>', { status: 200 })),
  ]
  for (const upstream of failures) {
    const result = await proxy(upstream)
    assert.equal(result.status, 502)
    assert.deepEqual(result.data, { error: copy })
  }
})
