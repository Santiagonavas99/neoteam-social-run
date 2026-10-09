const MAX_SOURCE_BYTES = 40 * 1024 * 1024
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

const OUTPUT_SIZES = [1920, 1440, 1024, 720, 480]
const OUTPUT_QUALITIES = [0.9, 0.8, 0.68, 0.55]
const IMAGE_EXTENSION = /\.(?:avif|bmp|gif|heic|heif|ico|jpe?g|png|tiff?|webp)$/i

export type UploadImageMime = 'image/webp' | 'image/png' | 'image/jpeg'
export type PreparedImage = {
  blob: Blob
  mime: UploadImageMime
  /** False when the WebP encoder is unavailable and PNG/JPG was used. */
  webp: boolean
}

export function isImageInput(file: { name: string; type: string }) {
  const mime = file.type.toLowerCase()
  if (mime === 'image/svg+xml') return false
  return mime.startsWith('image/') || IMAGE_EXTENSION.test(file.name)
}

/** On devices without WebP encoding, keep potentially transparent files as PNG. */
export function fallbackImageMime(file: { name: string; type: string }): 'image/png' | 'image/jpeg' {
  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()
  if (mime === 'image/jpeg' || mime === 'image/heic' || mime === 'image/heif') {
    return 'image/jpeg'
  }
  if (/\.(jpe?g|heic|heif)$/i.test(name)) return 'image/jpeg'
  return 'image/png'
}

function originalUploadMime(file: { name: string; type: string }): UploadImageMime | null {
  const mime = file.type.toLowerCase()
  if (mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp') return mime
  if (mime && mime !== 'application/octet-stream') return null
  if (/\.png$/i.test(file.name)) return 'image/png'
  if (/\.jpe?g$/i.test(file.name)) return 'image/jpeg'
  if (/\.webp$/i.test(file.name)) return 'image/webp'
  return null
}

export function fitImageDimensions(width: number, height: number, maxSide: number) {
  if (width <= 0 || height <= 0 || maxSide <= 0) {
    throw new Error('La imagen tiene dimensiones inválidas.')
  }
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function decodeImage(file: File): Promise<{ image: HTMLImageElement; release: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ image, release: () => URL.revokeObjectURL(url) })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Tu navegador no pudo abrir este formato. Prueba con JPG, PNG o WEBP.'))
    }
    image.src = url
  })
}

/**
 * Safari and other browsers may silently return PNG for a requested WebP.
 * A null result means this encoder cannot be used; do not pretend it is WebP.
 */
function encodeCanvas(
  canvas: HTMLCanvasElement,
  mime: UploadImageMime,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => resolve(blob && blob.size > 0 && blob.type === mime ? blob : null),
        mime,
        quality,
      )
    } catch {
      resolve(null)
    }
  })
}

/**
 * Prefer optimized WebP; use PNG/JPG when a mobile browser cannot encode WebP.
 * The existing admin API validates the MIME, file signature and 4 MiB limit.
 */
export async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  if (!isImageInput(file)) {
    throw new Error('Selecciona una imagen válida. Los archivos SVG no están admitidos.')
  }
  if (file.size === 0) throw new Error('La imagen está vacía.')
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('La imagen original debe pesar menos de 40 MB.')
  }

  const originalMime = originalUploadMime(file)
  // Do not re-encode an existing valid, small WebP, even on older mobile Safari.
  if (originalMime === 'image/webp' && file.size <= MAX_IMAGE_BYTES) {
    return { blob: file, mime: originalMime, webp: true }
  }

  let decoded: Awaited<ReturnType<typeof decodeImage>>
  try {
    decoded = await decodeImage(file)
  } catch (error) {
    // JPEG/PNG already within the API limit can still be uploaded natively.
    if (originalMime && file.size <= MAX_IMAGE_BYTES) {
      return { blob: file, mime: originalMime, webp: originalMime === 'image/webp' }
    }
    throw error
  }

  const { image, release } = decoded
  try {
    if (image.naturalWidth * image.naturalHeight > 80_000_000) {
      throw new Error('La imagen tiene demasiados píxeles para procesarla en el dispositivo.')
    }
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) {
      if (originalMime && file.size <= MAX_IMAGE_BYTES) {
        return { blob: file, mime: originalMime, webp: originalMime === 'image/webp' }
      }
      throw new Error('No pudimos preparar la imagen en este navegador.')
    }

    const draw = (maxSide: number) => {
      const dimensions = fitImageDimensions(image.naturalWidth, image.naturalHeight, maxSide)
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
    }

    let webpAvailable = true
    for (const maxSide of OUTPUT_SIZES) {
      draw(maxSide)
      for (const quality of OUTPUT_QUALITIES) {
        const blob = await encodeCanvas(canvas, 'image/webp', quality)
        if (!blob) {
          webpAvailable = false
          break
        }
        if (blob.size <= MAX_IMAGE_BYTES) return { blob, mime: 'image/webp', webp: true }
      }
      if (!webpAvailable) break
    }

    if (webpAvailable) throw new Error('No fue posible comprimir esta imagen por debajo de 4 MB.')

    // WebP not supported by this encoder. The backend already accepts these.
    if (originalMime && file.size <= MAX_IMAGE_BYTES) {
      return { blob: file, mime: originalMime, webp: originalMime === 'image/webp' }
    }

    const fallbackMime = fallbackImageMime(file)
    for (const maxSide of OUTPUT_SIZES) {
      draw(maxSide)
      for (const quality of fallbackMime === 'image/png' ? [1] : OUTPUT_QUALITIES) {
        const blob = await encodeCanvas(canvas, fallbackMime, quality)
        if (!blob) {
          throw new Error('Este navegador no pudo exportar la imagen. Prueba con JPG o PNG.')
        }
        if (blob.size <= MAX_IMAGE_BYTES) {
          return { blob, mime: fallbackMime, webp: false }
        }
      }
    }
    throw new Error('No fue posible reducir esta imagen a menos de 4 MB. Prueba con una más pequeña.')
  } finally {
    release()
  }
}
