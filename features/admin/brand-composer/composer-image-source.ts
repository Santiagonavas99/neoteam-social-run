const PUBLIC_STORAGE = 'https://ohatsnkgaeccltqwhkbv.supabase.co/storage/v1/object/public/'

/**
 * Restricted to the project's PUBLIC Supabase bucket images. Never accepts
 * arbitrary URLs, hosts, private storage or custom redirect destinations.
 */
export function safePublicComposerImageUrl(src: string | null): string | null {
  if (!src || src.length > 1200) return null
  try {
    const url = new URL(src)
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash ||
      !url.href.startsWith(PUBLIC_STORAGE) ||
      !/\.(png|jpe?g|webp)$/i.test(url.pathname)
    ) return null
    return url.href
  } catch {
    return null
  }
}

export function composerImageSrc(src: string): string {
  if (safePublicComposerImageUrl(src)) {
    return `/api/composer-image?src=${encodeURIComponent(src)}`
  }
  return src
}
