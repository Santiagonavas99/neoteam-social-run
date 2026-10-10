import { safePublicComposerImageUrl } from '@/features/admin/brand-composer/composer-image-source'

export const runtime = 'nodejs'
const maxBytes = 8 * 1024 * 1024
const allowedTypes = new Set(['image/webp', 'image/png', 'image/jpeg'])
const noStore = { 'Cache-Control': 'no-store' }

/**
 * Serves only public sponsor imagery from this project's Storage under the
 * site origin, so Canvas can read the pixels and export without tainted assets.
 */
export async function GET(request: Request): Promise<Response> {
  const src = safePublicComposerImageUrl(new URL(request.url).searchParams.get('src'))
  if (!src) {
    return new Response('URL de imagen no válida.', { status: 400, headers: noStore })
  }
  try {
    const upstream = await fetch(src, {
      redirect: 'error',
      cache: 'force-cache',
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: 'image/webp,image/png,image/jpeg' },
    })
    if (!upstream.ok) {
      return new Response('El logo no está disponible.', { status: 502, headers: noStore })
    }
    const mime = upstream.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
    if (!mime || !allowedTypes.has(mime)) {
      return new Response('El archivo no es una imagen compatible.', { status: 415, headers: noStore })
    }
    const size = Number(upstream.headers.get('content-length') ?? 0)
    if (size > maxBytes) {
      return new Response('Imagen demasiado grande.', { status: 413, headers: noStore })
    }
    const bytes = await upstream.arrayBuffer()
    if (!bytes.byteLength || bytes.byteLength > maxBytes) {
      return new Response('La imagen está vacía o supera el límite.', { status: 413, headers: noStore })
    }
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('No pudimos cargar el logo. Inténtalo otra vez.', {
      status: 502,
      headers: noStore,
    })
  }
}
