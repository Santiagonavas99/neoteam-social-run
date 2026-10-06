import { callEdgeFunction } from '@/lib/edge-function'
import { passQrDataUrl } from './qr'

export type Pass = { code: string; name: string; qr: string }

type ClaimInput = { documentNumber: string; email: string; code?: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function claimPass(input: ClaimInput): Promise<Pass | null> {
  const result = await callEdgeFunction('registration-pass', { action: 'claim', ...input })
  const data = result?.status === 200 ? result.data : null
  if (!isRecord(data) || typeof data.checkinToken !== 'string' || typeof data.code !== 'string') {
    return null
  }
  return {
    code: data.code,
    name: `${String(data.firstName ?? '')} ${String(data.lastName ?? '')}`.trim(),
    qr: passQrDataUrl(data.checkinToken),
  }
}
