import { headers } from 'next/headers'
import { isApplePlatform } from '@/features/event/platform'
import { callEdgeFunction } from '@/lib/edge-function'
import { googleWalletConfig } from './google-wallet'
import { passQrDataUrl } from './qr'
import { googleWalletPath } from './wallet'

export type Pass = {
  code: string
  name: string
  qr: string
  googleWalletUrl?: string
  emailed?: boolean
}

export type PassData = { code: string; checkinToken: string; name: string; emailed?: boolean }

type Identity = { documentNumber: string; email: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function lookup(body: Record<string, unknown>): Promise<PassData | null> {
  const result = await callEdgeFunction('registration-pass', body)
  const data = result?.status === 200 ? result.data : null
  if (!isRecord(data) || typeof data.checkinToken !== 'string' || typeof data.code !== 'string') {
    return null
  }
  return {
    code: data.code,
    checkinToken: data.checkinToken,
    name: `${String(data.firstName ?? '')} ${String(data.lastName ?? '')}`.trim(),
    emailed: data.emailed === true,
  }
}

async function toPass(data: PassData | null): Promise<Pass | null> {
  if (!data) return null
  const pass: Pass = {
    code: data.code,
    name: data.name,
    qr: passQrDataUrl(data.checkinToken),
    emailed: data.emailed,
  }
  const userAgent = (await headers()).get('user-agent') ?? ''
  if (googleWalletConfig(process.env) && !isApplePlatform(userAgent)) {
    pass.googleWalletUrl = googleWalletPath(data.checkinToken)
  }
  return pass
}

export function passByToken(token: string) {
  return lookup({ action: 'pass', token })
}

// Right after registering: shows the pass without a code and emails it once.
export async function registeredPass(input: Identity & { code: string }) {
  return toPass(await lookup({ action: 'registered', ...input }))
}

export async function requestPassCode(input: Identity): Promise<boolean> {
  const result = await callEdgeFunction('registration-pass', { action: 'requestCode', ...input })
  return result?.status === 200
}

export async function claimPass(input: Identity & { otp: string }): Promise<Pass | null> {
  return toPass(await lookup({ action: 'claim', ...input }))
}
