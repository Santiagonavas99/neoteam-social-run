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
