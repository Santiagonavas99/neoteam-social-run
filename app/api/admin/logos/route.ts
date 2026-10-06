import { proxyToEdgeFunction } from '@/lib/admin-proxy'

export const runtime = 'nodejs'

export function POST(request: Request) {
  return proxyToEdgeFunction(
    request,
    'admin-logos',
    'No pudimos conectar con el carrusel de logos. Inténtalo de nuevo.',
  )
}
