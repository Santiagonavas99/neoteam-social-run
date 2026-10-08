const MAX_SOURCE_BYTES = 40 * 1024 * 1024
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

const OUTPUT_SIZES = [1920, 1440, 1024, 720]
const OUTPUT_QUALITIES = [0.9, 0.8, 0.68, 0.55]
const IMAGE_EXTENSION = /\.(?:avif|bmp|gif|heic|heif|ico|jpe?g|png|tiff?|webp)$/i

export function isImageInput(file: { name: string; type: string }) {
  const mime = file.type.toLowerCase()
  if (mime === 'image/svg+xml') return false
  return mime.startsWith('image/') || IMAGE_EXTENSION.test(file.name)
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

function encodeWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size === 0 || blob.type !== 'image/webp') {
          reject(
            new Error('Este navegador no permite convertir a WEBP. Prueba con uno actualizado.'),
          )
          return
        }
        resolve(blob)
      },
      'image/webp',
      quality,
    )
  })
}

/** Converts browser-decodable raster images into an uploadable WebP, preserving transparency. */
export async function convertImageToWebp(file: File): Promise<Blob> {
  if (!isImageInput(file)) {
    throw new Error('Selecciona una imagen válida. Los archivos SVG no están admitidos.')
  }
  if (file.size === 0) throw new Error('La imagen está vacía.')
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('La imagen original debe pesar menos de 40 MB.')
  }

  const { image, release } = await decodeImage(file)
  try {
    if (image.naturalWidth * image.naturalHeight > 80_000_000) {
      throw new Error('La imagen tiene demasiados píxeles para procesarla en el dispositivo.')
    }
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No pudimos preparar la imagen en este navegador.')

    for (const maxSide of OUTPUT_SIZES) {
      const dimensions = fitImageDimensions(image.naturalWidth, image.naturalHeight, maxSide)
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      for (const quality of OUTPUT_QUALITIES) {
        const blob = await encodeWebp(canvas, quality)
        if (blob.size <= MAX_IMAGE_BYTES) return blob
      }
    }
    throw new Error('No fue posible comprimir esta imagen por debajo de 4 MB.')
  } finally {
    release()
  }
}
