export type WheelPrize = {
  id: string
  label: string
  quantity: number
  weight: number
  remaining: number
}

export type WheelSector = {
  key: string
  id: string | null
  label: string
  start: number
  end: number
  fill: string
  darkText: boolean
}

const COLORS = [
  { fill: '#F8C94E', darkText: true },
  { fill: '#09BFA5', darkText: true },
  { fill: '#F57A58', darkText: true },
  { fill: '#5F86FF', darkText: false },
  { fill: '#DF6DB7', darkText: false },
  { fill: '#C8E6DA', darkText: true },
]
const NO_PRIZE = { fill: '#334D4A', darkText: false }

/**
 * Render area proportional to the current configured chance and remaining
 * prize weights. The database, never these sectors, decides the actual award.
 */
export function buildWheelSectors(prizes: WheelPrize[], chance: number): WheelSector[] {
  const available = prizes.filter(
    (prize) => prize.remaining > 0 && Number.isFinite(prize.weight) && prize.weight > 0,
  )
  if (!available.length) return []

  const probability = Math.max(0, Math.min(1, Number.isFinite(chance) ? chance : 1))
  const totalWeight = available.reduce((total, item) => total + item.weight, 0)
  const entries: Array<{
    id: string | null
    label: string
    share: number
    palette: { fill: string; darkText: boolean }
  }> = available.map((item, index) => ({
    id: item.id,
    label: item.label,
    share: (probability * item.weight) / totalWeight,
    palette: COLORS[index % COLORS.length] ?? NO_PRIZE,
  }))
  if (probability < 1) {
    entries.push({ id: null, label: 'Sin premio', share: 1 - probability, palette: NO_PRIZE })
  }

  // Repeat only the visual slices; their total angle stays the exact probability.
  const visualParts = entries.map((entry) => ({
    ...entry,
    parts: entries.length === 1 ? 8 : Math.min(5, Math.max(1, Math.ceil(entry.share * 8))),
  }))
  let angle = 0
  const sectors: WheelSector[] = []
  const maxParts = Math.max(...visualParts.map((item) => item.parts))
  for (let repetition = 0; repetition < maxParts; repetition += 1) {
    for (const item of visualParts) {
      if (repetition >= item.parts || item.share <= 0) continue
      const increment = (360 * item.share) / item.parts
      sectors.push({
        key: `${item.id ?? 'none'}-${repetition}`,
        id: item.id,
        label: item.label,
        start: angle,
        end: angle + increment,
        fill: item.palette.fill,
        darkText: item.palette.darkText,
      })
      angle += increment
    }
  }
  // Avoid a visible seam from floating-point arithmetic at 360 degrees.
  const last = sectors.at(-1)
  if (last) last.end = 360
  return sectors
}

export function targetRotation(
  sectors: WheelSector[],
  winnerLabel: string | null,
  previousRotation: number,
): number | null {
  const matches = sectors.filter((sector) =>
    winnerLabel === null ? sector.id === null : sector.label === winnerLabel,
  )
  if (!matches.length) return null
  const sector = matches[Math.floor(Math.random() * matches.length)]
  if (!sector) return null
  const midpoint = (sector.start + sector.end) / 2
  const destination = (360 - midpoint + 360) % 360
  const current = ((previousRotation % 360) + 360) % 360
  // Five complete rotations plus a final alignment to the already-chosen result.
  return previousRotation + 5 * 360 + ((destination - current + 360) % 360)
}
