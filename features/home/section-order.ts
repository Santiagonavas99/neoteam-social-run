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
  | 'landak_studio'

export type HomeSectionOrder = {
  section_key: HomeSectionKey
  sort_order: number
  visible: boolean
}

export const defaultHomeSectionOrder: HomeSectionOrder[] = [
  { section_key: 'story', sort_order: 1, visible: true },
  { section_key: 'numbers', sort_order: 2, visible: true },
  { section_key: 'allies', sort_order: 3, visible: true },
  { section_key: 'running_crews', sort_order: 4, visible: true },
  { section_key: 'organizations', sort_order: 5, visible: true },
  { section_key: 'agenda', sort_order: 6, visible: true },
  { section_key: 'community', sort_order: 7, visible: true },
  { section_key: 'raffle', sort_order: 8, visible: true },
  { section_key: 'final', sort_order: 9, visible: true },
  { section_key: 'landak_studio', sort_order: 10, visible: true },
]

export const homeSectionMeta: Record<HomeSectionKey, { label: string; description: string }> = {
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
  landak_studio: {
    label: 'Landak Studio',
    description: 'Crédito creativo y enlace al estudio detrás de la experiencia digital.',
  },
}

const defaultIndex = new Map(
  defaultHomeSectionOrder.map((section, index) => [section.section_key, index]),
)

export function normalizeHomeSectionOrder(
  rows: Array<{ section_key?: string; sort_order?: number; visible?: boolean }> = [],
): HomeSectionOrder[] {
  const byKey = new Map<HomeSectionKey, { sort_order: number; visible: boolean }>()

  for (const row of rows) {
    const key = row.section_key as HomeSectionKey
    if (!Object.hasOwn(homeSectionMeta, key)) continue
    const order = Number(row.sort_order)
    if (!Number.isFinite(order)) continue
    byKey.set(key, {
      sort_order: Math.min(999, Math.max(1, Math.floor(order))),
      visible: row.visible !== false,
    })
  }

  return defaultHomeSectionOrder
    .map((section) => {
      const saved = byKey.get(section.section_key)
      return saved
        ? { ...section, sort_order: saved.sort_order, visible: saved.visible }
        : { ...section }
    })
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order ||
        (defaultIndex.get(a.section_key) ?? 0) - (defaultIndex.get(b.section_key) ?? 0),
    )
}
