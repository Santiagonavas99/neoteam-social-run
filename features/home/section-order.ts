export type HomeSectionKey =
  | 'story'
  | 'numbers'
  | 'allies'
  | 'running_crews'
  | 'organizations'
  | 'agenda'
  | 'community'
  | 'raffle'
  | 'final'

export type HomeSectionOrder = {
  section_key: HomeSectionKey
  sort_order: number
}

export const defaultHomeSectionOrder: HomeSectionOrder[] = [
  { section_key: 'story', sort_order: 1 },
  { section_key: 'numbers', sort_order: 2 },
  { section_key: 'allies', sort_order: 3 },
  { section_key: 'running_crews', sort_order: 4 },
  { section_key: 'organizations', sort_order: 5 },
  { section_key: 'agenda', sort_order: 6 },
  { section_key: 'community', sort_order: 7 },
  { section_key: 'raffle', sort_order: 8 },
  { section_key: 'final', sort_order: 9 },
]

export const homeSectionMeta: Record<
  HomeSectionKey,
  { label: string; description: string }
> = {
  story: {
    label: 'El plan',
    description: 'Presentación del encuentro, fecha, hora y ruta.',
  },
  numbers: {
    label: 'Números',
    description: 'Corredores inscritos y cantidad de marcas aliadas.',
  },
  allies: {
    label: 'Marcas aliadas',
    description: 'Cinta principal de logos aliados.',
  },
  running_crews: {
    label: 'Running crews',
    description: 'Cinta de crews participantes.',
  },
  organizations: {
    label: 'Organizaciones',
    description: 'Cinta de organizaciones vinculadas.',
  },
  agenda: {
    label: 'Agenda',
    description: 'Cronograma del Social Run.',
  },
  community: {
    label: 'Comunidad y partners',
    description: 'Marcas, partners y marcas invitadas.',
  },
  raffle: {
    label: 'Rifas',
    description: 'Bloque de premios y celebración.',
  },
  final: {
    label: 'Nos vemos',
    description: 'Cierre, registro y punto de encuentro.',
  },
}

const defaultIndex = new Map(
  defaultHomeSectionOrder.map((section, index) => [section.section_key, index]),
)

export function normalizeHomeSectionOrder(
  rows: Array<{ section_key?: string; sort_order?: number }> = [],
): HomeSectionOrder[] {
  const byKey = new Map<HomeSectionKey, number>()

  for (const row of rows) {
    const key = row.section_key as HomeSectionKey
    if (!Object.hasOwn(homeSectionMeta, key)) continue
    const order = Number(row.sort_order)
    if (!Number.isFinite(order)) continue
    byKey.set(key, Math.min(999, Math.max(1, Math.floor(order))))
  }

  return defaultHomeSectionOrder
    .map((section) => ({
      ...section,
      sort_order: byKey.get(section.section_key) ?? section.sort_order,
    }))
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        (defaultIndex.get(a.section_key) ?? 0) - (defaultIndex.get(b.section_key) ?? 0),
    )
}
