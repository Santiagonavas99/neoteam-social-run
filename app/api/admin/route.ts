import { proxyToEdgeFunction } from '@/lib/admin-proxy'

export const runtime = 'nodejs'

export function POST(request: Request) {
  return proxyToEdgeFunction(
    request,
    'admin-pin',
    'No pudimos conectar con el panel administrativo. Inténtalo de nuevo.',
  )
}
