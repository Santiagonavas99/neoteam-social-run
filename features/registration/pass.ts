import { callEdgeFunction } from '@/lib/edge-function'
import { passQrDataUrl } from './qr'

export type Pass = { code: string; name: string; qr: string }

export type PassData = { code: string; checkinToken: string; name: string }

type ClaimInput = { documentNumber: string; email: string; code?: string }

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
  }
}

export function passByToken(token: string) {
  return lookup({ action: 'pass', token })
}

export async function claimPass(input: ClaimInput): Promise<Pass | null> {
  const data = await lookup({ action: 'claim', ...input })
  if (!data) return null
  return { code: data.code, name: data.name, qr: passQrDataUrl(data.checkinToken) }
}
