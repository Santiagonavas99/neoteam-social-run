import {
  Flag,
  GalleryHorizontal,
  Gift,
  LayoutDashboard,
  type LucideIcon,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react'

export type AdminSection =
  | 'metrics'
  | 'logos'
  | 'participants'
  | 'groups'
  | 'brands'
  | 'raffles'
  | 'security'

export type AdminSectionInfo = {
  id: AdminSection
  label: string
  description: string
  icon: LucideIcon
  quickAccess?: string
}

export const adminSections: [AdminSectionInfo, ...AdminSectionInfo[]] = [
  {
    id: 'metrics',
    label: 'Overview',
    description: 'El pulso del Social Run, en un vistazo.',
    icon: LayoutDashboard,
  },
  {
    id: 'logos',
    label: 'Carrusel logos',
    description: 'Sube, ordena y publica los logos de la cinta horizontal de la Home.',
    icon: GalleryHorizontal,
  },
  {
    id: 'participants',
    label: 'Participantes',
    description: 'Encuentra a cada corredor y gestiona su asistencia.',
    icon: Users,
    quickAccess: 'Lista y check-in',
  },
  {
    id: 'groups',
    label: 'Grupos',
    description: 'Las comunidades que corren con nosotros.',
    icon: Flag,
    quickAccess: 'Comunidades invitadas',
  },
  {
    id: 'brands',
    label: 'Marcas',
    description: 'Los aliados que hacen parte del encuentro.',
    icon: Tag,
    quickAccess: 'Aliados y logos',
  },
  {
    id: 'raffles',
    label: 'Rifas',
    description: 'Prepara los premios y gestiona cada sorteo.',
    icon: Gift,
    quickAccess: 'Premios y sorteos',
  },
  {
    id: 'security',
    label: 'Seguridad',
    description: 'Administra el acceso al panel del evento.',
    icon: ShieldCheck,
  },
]

export function sectionInfo(id: AdminSection) {
  return adminSections.find((section) => section.id === id) ?? adminSections[0]
}
