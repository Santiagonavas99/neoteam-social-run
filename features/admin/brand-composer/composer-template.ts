import type { CompositionRect } from './composer-layout'

/** The safe-area is expressed as a fraction of the exported canvas (0–1). */
export type LogoZone = { x: number; y: number; width: number; height: number }
export type TemplateColumns = 'auto' | 2 | 3 | 4 | 5 | 6

export const verticalAlliesZone: LogoZone = {
  x: 0.07,
  y: 0.41,
  width: 0.86,
  height: 0.4,
}

export function clampLogoZone(zone: LogoZone): LogoZone {
  const width = Math.max(0.2, Math.min(0.98, zone.width))
  const height = Math.max(0.15, Math.min(0.9, zone.height))
  return {
    x: Math.max(0, Math.min(1 - width, zone.x)),
    y: Math.max(0, Math.min(1 - height, zone.y)),
    width,
    height,
  }
}

export function recommendedColumns(count: number): number {
  if (count <= 1) return 1
  if (count <= 3) return count
  if (count === 4) return 2
  if (count <= 6) return 3
  if (count <= 8) return 4
  if (count === 9) return 3
  if (count <= 16) return 4
  if (count <= 25) return 5
  if (count <= 36) return 6
  return Math.ceil(Math.sqrt(count))
}

/** Computes equally-spaced logo cards inside one user-defined safe area. */
export function templateLogoSlots(
  width: number,
  height: number,
  count: number,
  zone: LogoZone,
  columns: TemplateColumns,
  gapPercent: number,
): CompositionRect[] {
  if (!(width > 0 && height > 0) || !Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error('El tamaño de la imagen no es válido.')
  }
  if (!Number.isInteger(count) || count < 0 || count > 80) {
    throw new Error('Selecciona entre 0 y 80 marcas.')
  }
  if (count === 0) return []
  const area = clampLogoZone(zone)
  const region = {
    x: area.x * width,
    y: area.y * height,
    width: area.width * width,
    height: area.height * height,
  }
  const cols = Math.min(count, columns === 'auto' ? recommendedColumns(count) : columns)
  const rows = Math.ceil(count / cols)
  const gap = Math.max(0, Math.min(0.06, gapPercent)) * Math.min(width, height)
  const cellWidth = (region.width - (cols - 1) * gap) / cols
  const cellHeight = (region.height - (rows - 1) * gap) / rows
  if (cellWidth <= 2 || cellHeight <= 2) {
    throw new Error('La zona es demasiado pequeña para esta cantidad de marcas.')
  }
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    const occupied = Math.min(cols, count - row * cols)
    const rowWidth = occupied * cellWidth + (occupied - 1) * gap
    const offset = (region.width - rowWidth) / 2
    return {
      x: Math.round(region.x + offset + col * (cellWidth + gap)),
      y: Math.round(region.y + row * (cellHeight + gap)),
      width: Math.round(cellWidth),
      height: Math.round(cellHeight),
    }
  })
}

/** Normalize pointer positions within the real rendered image, not its outer panel. */
export function moveLogoZone(current: LogoZone, dx: number, dy: number, resize: boolean): LogoZone {
  return clampLogoZone(
    resize
      ? { ...current, width: current.width + dx, height: current.height + dy }
      : { ...current, x: current.x + dx, y: current.y + dy },
  )
}
