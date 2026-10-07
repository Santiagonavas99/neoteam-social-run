// @ts-nocheck
import { secretsMatch, sha256 } from './proxy.ts'

export const CODE_MINUTES = 10
export const CODE_MAX_ATTEMPTS = 5
export const CODES_PER_WINDOW = 3
export const CODE_WINDOW_MINUTES = 15

// ponytail: modulo bias of 2^32 % 10^6 is about 0.02%, negligible for a 10-minute code.
export function randomCode() {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return String(value[0] % 1_000_000).padStart(6, '0')
}

// Salting with the owner's id keeps equal codes for different people from sharing a hash.
export function hashCode(ownerId: string, code: string) {
  return sha256(`${ownerId}:${code}`)
}

export async function codeMatches(ownerId: string, code: string, expectedHash: string) {
  return secretsMatch(await hashCode(ownerId, code), expectedHash)
}

export function validCode(code: unknown): code is string {
  return typeof code === 'string' && /^\d{6}$/.test(code)
}

export function cleanEmail(value: unknown) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return email.length <= 160 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null
}
