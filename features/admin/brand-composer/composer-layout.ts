export type CompositionFormat = 'square' | 'portrait' | 'three-four' | 'story' | 'landscape'
export type CompositionLayout = 'bottom' | 'grid' | 'center'
export type CompositionRect = { x: number; y: number; width: number; height: number }

export const compositionFormats: Record<
  CompositionFormat,
  { label: string; width: number; height: number }
> = {
  square: { label: 'Cuadrado · 1:1', width: 1080, height: 1080 },
  portrait: { label: 'Post · 4:5', width: 1080, height: 1350 },
  'three-four': { label: 'Vertical · 3:4', width: 1080, height: 1440 },
  story: { label: 'Story · 9:16', width: 1080, height: 1920 },
  landscape: { label: 'Horizontal · 16:9', width: 1920, height: 1080 },
}

export const compositionLayouts: Record<CompositionLayout, string> = {
  bottom: 'Franja inferior',
  grid: 'Mosaico',
  center: 'Bloque protagonista',
}

/** All coordinates use export pixels: the preview and downloaded file are identical. */
export function logoSlots(
  width: number,
  height: number,
  count: number,
  layout: CompositionLayout,
  scale = 1,
): CompositionRect[] {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('El formato no es válido.')
  }
  if (!Number.isInteger(count) || count < 0 || count > 80) {
    throw new Error('La cantidad de marcas no es válida.')
  }
  if (!count) return []

  const margin = Math.round(Math.min(width, height) * 0.045)
  const areaWidth = width - margin * 2
  const areaTop = layout === 'bottom' ? height * 0.58 : layout === 'center' ? height * 0.245 : height * 0.17
  const areaHeight = (layout === 'bottom' ? 0.36 : layout === 'center' ? 0.53 : 0.7) * height
  const rows =
    layout === 'bottom'
      ? Math.min(3, Math.ceil(count / 5))
      : Math.max(1, Math.ceil(Math.sqrt(count / ((areaWidth / areaHeight) * 1.35))))
  const columns = Math.ceil(count / rows)
  const gap = Math.max(6, Math.round(Math.min(width, height) * 0.014))
  const cellW = (areaWidth - gap * (columns - 1)) / columns
  const cellH = (areaHeight - gap * (rows - 1)) / rows
  const fit = Math.max(0.55, Math.min(1, scale))
  const tileW = Math.min(cellW * fit, cellH * fit * 2.2)
  const tileH = Math.min(cellH * fit, tileW / 1.65)
  if (tileW <= 0 || tileH <= 0) throw new Error('No hay espacio suficiente para los logos.')

  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / columns)
    const column = index % columns
    const itemsInRow = Math.min(columns, count - row * columns)
    const centeredOffset = (columns - itemsInRow) * (cellW + gap) / 2
    return {
      x: Math.round(margin + centeredOffset + column * (cellW + gap) + (cellW - tileW) / 2),
      y: Math.round(areaTop + row * (cellH + gap) + (cellH - tileH) / 2),
      width: Math.round(tileW),
      height: Math.round(tileH),
    }
  })
}

export function containRect(imageWidth: number, imageHeight: number, rect: CompositionRect) {
  if (imageWidth <= 0 || imageHeight <= 0) throw new Error('Logo inválido.')
  const factor = Math.min(rect.width / imageWidth, rect.height / imageHeight)
  const width = imageWidth * factor
  const height = imageHeight * factor
  return {
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height,
  }
}
