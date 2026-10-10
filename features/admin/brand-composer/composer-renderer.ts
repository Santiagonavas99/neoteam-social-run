import { composerImageSrc } from './composer-image-source'
import {
  type CompositionFormat,
  type CompositionLayout,
  compositionFormats,
  containRect,
  logoSlots,
} from './composer-layout'
import type { ComposerBrand } from './composer-library'

export type ComposerSettings = {
  format: CompositionFormat
  layout: CompositionLayout
  scale: number
  overlay: number
  tiles: boolean
  title: string
  backgroundUrl: string | null
  brands: ComposerBrand[]
}

const cache = new Map<string, Promise<CanvasImageSource>>()

async function decodeImage(blob: Blob): Promise<CanvasImageSource> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob)
    } catch {
      // Some browsers cannot decode SVG/WebP through ImageBitmap.
    }
  }
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(blob)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Imagen no compatible.'))
    }
    image.src = url
  })
}

async function loadAsset(src: string): Promise<CanvasImageSource> {
  // First use our same-origin proxy; if deployment protection or the proxy
  // fails, try the original public Storage URL with browser CORS as backup.
  const preferred = composerImageSrc(src)
  const candidates = preferred === src ? [src] : [preferred, src]
  let lastError: unknown

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        credentials: 'same-origin',
        cache: 'force-cache',
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      if (!blob.type.startsWith('image/')) throw new Error('El servidor no devolvió una imagen.')
      return await decodeImage(blob)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Imagen no disponible.')
}

function asset(src: string) {
  let promise = cache.get(src)
  if (!promise) {
    promise = loadAsset(src).catch((error: unknown) => {
      cache.delete(src)
      throw error
    })
    cache.set(src, promise)
  }
  return promise
}

function dimensions(image: CanvasImageSource): { width: number; height: number } {
  if (image instanceof HTMLImageElement) {
    return { width: image.naturalWidth, height: image.naturalHeight }
  }
  return { width: (image as ImageBitmap).width, height: (image as ImageBitmap).height }
}

function cover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
) {
  const size = dimensions(image)
  const ratio = Math.max(width / size.width, height / size.height)
  const sw = width / ratio
  const sh = height / ratio
  ctx.drawImage(image, (size.width - sw) / 2, (size.height - sh) / 2, sw, sh, 0, 0, width, height)
}

function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Preview and export both run this exact drawing pipeline, at the selected
 * final pixel dimensions. Missing images are reported and block export.
 */
export async function renderComposition(
  canvas: HTMLCanvasElement,
  settings: ComposerSettings,
): Promise<string[]> {
  const { width, height } = compositionFormats[settings.format]
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Tu navegador no permite crear la composición.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.fillStyle = '#050b0b'
  ctx.fillRect(0, 0, width, height)
  if (settings.backgroundUrl) {
    try {
      cover(ctx, await asset(settings.backgroundUrl), width, height)
    } catch {
      throw new Error('No pudimos abrir la imagen de fondo. Selecciona otro PNG, JPG o WebP.')
    }
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#061011')
    gradient.addColorStop(0.64, '#003f40')
    gradient.addColorStop(1, '#060d0d')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  if (settings.overlay > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, Math.min(0.75, settings.overlay))})`
    ctx.fillRect(0, 0, width, height)
  }

  if (settings.title.trim()) {
    const size = Math.round(Math.min(width, height) * 0.065)
    ctx.font = `900 ${size}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,0,0,.55)'
    ctx.shadowBlur = 18
    ctx.fillText(settings.title.trim().slice(0, 48), width / 2, height * 0.09, width * 0.89)
    ctx.shadowBlur = 0
  }

  const slots = logoSlots(width, height, settings.brands.length, settings.layout, settings.scale)
  const assets = await Promise.allSettled(settings.brands.map((brand) => asset(brand.src)))
  const missing: string[] = []
  for (let i = 0; i < settings.brands.length; i++) {
    const brand = settings.brands[i]
    const rect = slots[i]
    const outcome = assets[i]
    if (!brand || !rect || !outcome) continue

    if (settings.tiles) {
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.2)'
      ctx.shadowBlur = Math.round(Math.min(width, height) * 0.025)
      ctx.shadowOffsetY = 3
      rounded(ctx, rect.x, rect.y, rect.width, rect.height, Math.min(20, rect.height * 0.14))
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.restore()
    }
    if (outcome.status === 'rejected') {
      missing.push(brand.name)
      // A failed image must not look like an intentionally empty white tile.
      ctx.save()
      ctx.strokeStyle = '#e66a68'
      ctx.lineWidth = Math.max(2, width * 0.002)
      rounded(ctx, rect.x, rect.y, rect.width, rect.height, Math.min(20, rect.height * 0.14))
      ctx.stroke()
      ctx.fillStyle = '#9b2626'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `700 ${Math.max(12, Math.min(24, rect.width / 10))}px Arial, sans-serif`
      ctx.fillText('SIN LOGO', rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width * 0.9)
      ctx.restore()
      continue
    }
    const inset = settings.tiles ? 0.13 : 0.04
    const inner = {
      x: rect.x + rect.width * inset,
      y: rect.y + rect.height * inset,
      width: rect.width * (1 - inset * 2),
      height: rect.height * (1 - inset * 2),
    }
    const size = dimensions(outcome.value)
    if (size.width > 0 && size.height > 0) {
      const fit = containRect(size.width, size.height, inner)
      ctx.drawImage(outcome.value, fit.x, fit.y, fit.width, fit.height)
    } else {
      missing.push(brand.name)
    }
  }
  return missing
}

export async function exportComposition(
  canvas: HTMLCanvasElement,
  mime: 'image/png' | 'image/jpeg',
) {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob?.size || blob.type !== mime) {
            reject(new Error('Tu navegador no pudo generar este formato de imagen.'))
            return
          }
          resolve(blob)
        },
        mime,
        mime === 'image/jpeg' ? 0.94 : undefined,
      )
    } catch {
      reject(new Error('No se pudo exportar la imagen. Revisa los logos y vuelve a intentarlo.'))
    }
  })
}
