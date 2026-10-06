// @ts-nocheck
export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function secretsMatch(candidate: unknown, expected: string) {
  if (typeof candidate !== 'string' || candidate.length > 1024) return false
  const left = new TextEncoder().encode(candidate.trim())
  const right = new TextEncoder().encode(expected)
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i]
  return diff === 0
}

const ADMIN_PROXY_SECRET = Deno.env.get('ADMIN_PROXY_SECRET')?.trim() ?? ''

// Only the Next server holds ADMIN_PROXY_SECRET, so a request carrying it came through
// the proxy and its client IP header can be trusted.
export async function fromProxy(req: Request) {
  if (ADMIN_PROXY_SECRET.length < 32) return false
  const candidate = (req.headers.get('x-admin-proxy-secret') ?? '').slice(0, 1024).trim()
  return secretsMatch(await sha256(candidate), await sha256(ADMIN_PROXY_SECRET))
}
