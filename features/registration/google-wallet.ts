import { createSign } from 'node:crypto'
import { eventConfig } from '../event/event.ts'
import { passFacts } from '../event/pass-facts.ts'
import type { PassData } from './pass'
import { QR_PREFIX } from './qr.ts'

export type GoogleWalletConfig = {
  issuerId: string
  serviceAccountEmail: string
  privateKey: string
  classSuffix: string
}

type Env = Record<string, string | undefined>
type Fetch = typeof fetch

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const OBJECT_URL =
  'https://walletobjects.googleapis.com/walletobjects/v1/eventTicketObject'
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer'

export function googleWalletConfig(env: Env): GoogleWalletConfig | null {
  const issuerId = env.GOOGLE_WALLET_ISSUER_ID?.trim()
  const serviceAccountEmail =
    env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL?.trim()
  const keyBase64 = env.GOOGLE_WALLET_PRIVATE_KEY_BASE64?.trim()

  if (!issuerId || !serviceAccountEmail || !keyBase64) return null

  return {
    issuerId,
    serviceAccountEmail,
    privateKey: Buffer.from(keyBase64, 'base64').toString('utf8'),
    classSuffix:
      env.GOOGLE_WALLET_CLASS_SUFFIX?.trim() ||
      'neoteam_social_run_2026',
  }
}

const base64url = (value: string) =>
  Buffer.from(value).toString('base64url')

export function signJwt(
  payload: Record<string, unknown>,
  privateKey: string,
) {
  const input = `${base64url(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
  )}.${base64url(JSON.stringify(payload))}`

  const signature = createSign('RSA-SHA256')
    .update(input)
    .sign(privateKey)
    .toString('base64url')

  return `${input}.${signature}`
}

export function walletObject(
  pass: PassData,
  config: GoogleWalletConfig,
) {
  const classId = `${config.issuerId}.${config.classSuffix}`

  // Google Wallet expects:
  // classId  = ISSUER_ID.CLASS_SUFFIX
  // objectId = ISSUER_ID.OBJECT_SUFFIX
  const objectSuffix = pass.checkinToken.replaceAll('-', '')
  const objectId = `${config.issuerId}.${objectSuffix}`

  return {
    id: objectId,
    classId,
    state: 'ACTIVE',
    ticketHolderName: pass.name,
    ticketNumber: pass.code,
    reservationInfo: {
      confirmationCode: pass.code,
    },
    barcode: {
      type: 'QR_CODE',
      value: `${QR_PREFIX}${pass.checkinToken}`,
      alternateText: pass.code,
    },
    hexBackgroundColor: '#050505',
    textModulesData: [
      {
        id: 'route',
        header: 'RECORRIDO',
        body: eventConfig.route,
      },
      ...passFacts.map(({ id, label, value }) => ({
        id,
        header: label.toUpperCase(),
        body: value,
      })),
    ],
  }
}

export function saveJwt(
  object: { id: string; classId: string },
  config: GoogleWalletConfig,
) {
  return signJwt(
    {
      iss: config.serviceAccountEmail,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      origins: [],
      payload: {
        eventTicketObjects: [
          {
            id: object.id,
            classId: object.classId,
          },
        ],
      },
    },
    config.privateKey,
  )
}

function googleErrorReason(body: unknown): string | null {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('error' in body)
  ) {
    return null
  }

  const error = body.error

  if (
    typeof error !== 'object' ||
    error === null ||
    !('status' in error)
  ) {
    return null
  }

  return typeof error.status === 'string'
    ? error.status
    : null
}

const fail = (
  stage: string,
  status: number,
  reason?: string | null,
) =>
  new Error(
    `google-wallet ${stage} ${status}${
      reason ? ` ${reason}` : ''
    }`,
  )

let cachedToken: {
  value: string
  expiresAt: number
} | null = null

async function accessToken(
  config: GoogleWalletConfig,
  fetcher: Fetch,
) {
  const now = Date.now()

  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.value
  }

  const iat = Math.floor(now / 1000)

  const assertion = signJwt(
    {
      iss: config.serviceAccountEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat,
      exp: iat + 3600,
    },
    config.privateKey,
  )

  const response = await fetcher(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type':
        'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type:
        'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  })

  const body: unknown = await response
    .json()
    .catch(() => null)

  const token =
    typeof body === 'object' &&
    body !== null &&
    'access_token' in body
      ? body.access_token
      : null

  const expiresIn =
    typeof body === 'object' &&
    body !== null &&
    'expires_in' in body
      ? Number(body.expires_in)
      : 0

  if (!response.ok || typeof token !== 'string') {
    throw fail('oauth', response.status)
  }

  cachedToken = {
    value: token,
    expiresAt:
      now +
      (Math.max(expiresIn, 120) - 60) * 1000,
  }

  return token
}

async function ensureObject(
  token: string,
  object: { id: string },
  fetcher: Fetch,
) {
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const existing = await fetcher(
    `${OBJECT_URL}/${encodeURIComponent(object.id)}`,
    {
      headers,
      cache: 'no-store',
    },
  )

  if (existing.ok) return

  if (existing.status !== 404) {
    const body: unknown = await existing
      .json()
      .catch(() => null)

    throw fail(
      'object-get',
      existing.status,
      googleErrorReason(body),
    )
  }

  const created = await fetcher(OBJECT_URL, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(object),
    cache: 'no-store',
  })

  if (!created.ok && created.status !== 409) {
    const body: unknown = await created
      .json()
      .catch(() => null)

    throw fail(
      'object-insert',
      created.status,
      googleErrorReason(body),
    )
  }
}

// Creating the object over REST first is the flow
// validated for this issuer.
export async function googleSaveUrl(
  pass: PassData,
  config: GoogleWalletConfig,
  fetcher: Fetch = fetch,
) {
  const object = walletObject(pass, config)

  const token = await accessToken(config, fetcher)

  await ensureObject(token, object, fetcher)

  return `https://pay.google.com/gp/v/save/${saveJwt(
    object,
    config,
  )}`
}
