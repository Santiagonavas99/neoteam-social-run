import { gunzipSync } from 'node:zlib'

export type ProxyEnv = Record<string, string | undefined>

// Edge Functions accept only requests carrying the shared proxy secret, so the
// client IP header below is trusted by them and cannot be forged by a caller.
export function adminUpstreamHeaders(
  request: Request,
  key: string,
  env: ProxyEnv = process.env,
): Record<string, string> | null {
  const secret = env.ADMIN_PROXY_SECRET?.trim()
  if (!secret) return null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: key,
    'x-admin-proxy-secret': secret,
  }
  // Vercel sets x-forwarded-for at its edge; outside Vercel it is caller-controlled.
  if (env.VERCEL === '1') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (ip) headers['x-admin-client-ip'] = ip
  }
  return headers
}

const MAX_ADMIN_BODY_BYTES = 6 * 1024 * 1024

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Gzip transport keeps 4 MB image uploads below Vercel's request limit; the
// output cap stops a small compressed body from expanding without bound.
export async function parseAdminBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown =
      request.headers.get('content-encoding') === 'gzip'
        ? JSON.parse(
            gunzipSync(Buffer.from(await request.arrayBuffer()), {
              maxOutputLength: MAX_ADMIN_BODY_BYTES,
            }).toString('utf8'),
          )
        : await request.json()
    return isRecord(parsed) && typeof parsed.action === 'string' ? parsed : null
  } catch {
    return null
  }
}
