import assert from 'node:assert/strict'
import { createVerify, generateKeyPairSync } from 'node:crypto'
import test from 'node:test'
import { googleSaveUrl, googleWalletConfig, signJwt, walletObject } from './google-wallet.ts'

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})

const env = {
  GOOGLE_WALLET_ISSUER_ID: '123',
  GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: 'wallet@test.iam.gserviceaccount.com',
  GOOGLE_WALLET_PRIVATE_KEY_BASE64: Buffer.from(privateKey).toString('base64'),
}
const token = '0f8fad5b-d9cb-469f-a165-70867728950e'
const pass = { code: 'SR26-00042', checkinToken: token, name: 'Ana Ruiz' }

const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))

function jwtParts(jwt: string) {
  const [header = '', payload = '', signature = ''] = jwt.split('.')
  return { header, payload, signature }
}

test('config needs the issuer, the service account and the key', () => {
  assert.equal(googleWalletConfig({ ...env, GOOGLE_WALLET_ISSUER_ID: ' ' }), null)
  assert.equal(googleWalletConfig({ ...env, GOOGLE_WALLET_PRIVATE_KEY_BASE64: undefined }), null)
  const config = googleWalletConfig(env)
  assert.equal(config?.privateKey, privateKey)
  assert.equal(config?.classSuffix, 'neoteam_social_run_2026')
})

test('signs an RS256 JWT that verifies with the public key', () => {
  const { header, payload, signature } = jwtParts(signJwt({ hello: 'world' }, privateKey))
  assert.equal(decode(header).alg, 'RS256')
  assert.equal(decode(payload).hello, 'world')
  const valid = createVerify('RSA-SHA256')
    .update(`${header}.${payload}`)
    .verify(publicKey, Buffer.from(signature, 'base64url'))
  assert.ok(valid)
})

test('creates the object once, then saves with a JWT that only references it', async () => {
  const config = googleWalletConfig(env)
  assert.ok(config)
  const calls: { url: string; method: string; body?: string }[] = []
  const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, method: init?.method ?? 'GET', body: init?.body?.toString() })
    if (url.includes('oauth2')) return Response.json({ access_token: 'at', expires_in: 3600 })
    if (init?.method === 'POST') return Response.json({}, { status: 200 })
    return Response.json({}, { status: calls.length > 3 ? 200 : 404 })
  }

  const url = await googleSaveUrl(pass, config, fetcher as typeof fetch)
  assert.deepEqual(
    calls.map((call) => call.method),
    ['POST', 'GET', 'POST'],
  )
  const object = JSON.parse(calls[2]?.body ?? '{}')
  assert.equal(object.id, '123.0f8fad5bd9cb469fa16570867728950e')
  assert.equal(object.barcode.value, `NEOTEAM-SR26:${token}`)

  const jwt = url.replace('https://pay.google.com/gp/v/save/', '')
  const payload = decode(jwtParts(jwt).payload)
  assert.equal(payload.typ, 'savetowallet')
  assert.deepEqual(payload.payload.eventTicketObjects, [
    { id: object.id, classId: '123.neoteam_social_run_2026' },
  ])

  await googleSaveUrl(pass, config, fetcher as typeof fetch)
  assert.equal(calls.length, 4, 'reuses the OAuth token and the existing object')
})

test('reports only the stage and status when Google fails', async () => {
  const config = googleWalletConfig({ ...env, GOOGLE_WALLET_CLASS_SUFFIX: 'other' })
  assert.ok(config)
  const fetcher = async (input: string | URL | Request) =>
    String(input).includes('oauth2')
      ? Response.json({ access_token: 'at', expires_in: 3600 })
      : new Response('secret details', { status: 403 })
  await assert.rejects(googleSaveUrl(pass, config, fetcher as typeof fetch), {
    message: 'google-wallet object-get 403',
  })
})

test('the Wallet object shows the date, arrival and place', () => {
  const config = googleWalletConfig(env)
  assert.ok(config)
  const modules = walletObject(pass, config).textModulesData
  assert.deepEqual(
    modules.map(({ header }) => header),
    ['RECORRIDO', 'FECHA', 'LLEGADA', 'LUGAR'],
  )
  assert.equal(modules.at(-1)?.body, 'Parque del Ingenio, Cali')
})
