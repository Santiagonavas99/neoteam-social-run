import assert from 'node:assert/strict'
import { test } from 'node:test'
import { callEdgeFunction } from './edge-function.ts'

const env = {
  SUPABASE_URL: 'https://db.test/',
  SUPABASE_PUBLISHABLE_KEY: 'pk',
  ADMIN_PROXY_SECRET: 's',
}

async function call(upstream: () => Promise<Response>, overrides = {}) {
  const calls: { url: string; init: RequestInit }[] = []
  const original = globalThis.fetch
  const originalError = console.error
  globalThis.fetch = (input, init) => {
    calls.push({ url: String(input), init: init ?? {} })
    return upstream()
  }
  console.error = () => {}
  try {
    return {
      result: await callEdgeFunction(
        'registration-pass',
        { action: 'claim' },
        { ...env, ...overrides },
      ),
      calls,
    }
  } finally {
    globalThis.fetch = original
    console.error = originalError
  }
}

const ok = () => Promise.resolve(Response.json({ ok: true }))

test('returns null without the proxy secret and never calls upstream', async () => {
  const { result, calls } = await call(ok, { ADMIN_PROXY_SECRET: undefined })
  assert.equal(result, null)
  assert.equal(calls.length, 0)
})

test('posts the body with the proxy secret to the named function', async () => {
  const { result, calls } = await call(() =>
    Promise.resolve(Response.json({ error: 'x' }, { status: 404 })),
  )
  const [first] = calls
  assert.equal(first?.url, 'https://db.test/functions/v1/registration-pass')
  const init = first?.init ?? {}
  assert.equal(init.body, '{"action":"claim"}')
  assert.equal(new Headers(init.headers).get('x-admin-proxy-secret'), 's')
  assert.deepEqual(result, { status: 404, data: { error: 'x' } })
})

test('hides upstream 5xx and network failures', async () => {
  assert.equal((await call(() => Promise.resolve(new Response('', { status: 500 })))).result, null)
  assert.equal((await call(() => Promise.reject(new Error('network')))).result, null)
})
