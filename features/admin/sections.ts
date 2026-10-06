import {
  Flag,
  GalleryHorizontal,
  LayoutDashboard,
  type LucideIcon,
  ShieldCheck,
  Tag,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react'

export type AdminSection =
  | 'checkin'
  | 'metrics'
  | 'logos'
  | 'participants'
  | 'groups'
  | 'brands'
  | 'dynamics'
  | 'security'

export type AdminSectionGroup = 'event' | 'content' | 'account'

export type AdminSectionInfo = {
  id: AdminSection
  label: string
  description: string
  icon: LucideIcon
  group: AdminSectionGroup
  primary?: true
}

export const sectionGroups: { id: AdminSectionGroup; label: string }[] = [
  { id: 'event', label: 'Día del evento' },
  { id: 'content', label: 'Contenido del sitio' },
  { id: 'account', label: 'Cuenta' },
]

export const adminSections: [AdminSectionInfo, ...AdminSectionInfo[]] = [
  {
    id: 'metrics',
    label: 'Overview',
    description: 'El pulso del Social Run, en un vistazo.',
    icon: LayoutDashboard,
    group: 'event',
  },
  {
    id: 'checkin',
    label: 'Check-in',
    description: 'Escanea el QR o escribe el código de cada corredor.',
    icon: UserCheck,
    group: 'event',
    primary: true,
  },
  {
    id: 'participants',
    label: 'Participantes',
    description: 'Encuentra a cada corredor y gestiona su asistencia.',
    icon: Users,
    group: 'event',
    primary: true,
  },
  {
    id: 'dynamics',
    label: 'Dinámicas',
    description: 'Stands, retos, premios instantáneos y sorteos.',
    icon: Zap,
    group: 'event',
    primary: true,
  },
  {
    id: 'logos',
    label: 'Carrusel logos',
    description: 'Sube, ordena y publica los logos de la cinta horizontal de la Home.',
    icon: GalleryHorizontal,
    group: 'content',
  },
  {
    id: 'groups',
    label: 'Grupos',
    description: 'Las comunidades que corren con nosotros.',
    icon: Flag,
    group: 'content',
  },
  {
    id: 'brands',
    label: 'Marcas',
    description: 'Los aliados que hacen parte del encuentro.',
    icon: Tag,
    group: 'content',
  },
  {
    id: 'security',
    label: 'Seguridad',
    description: 'Administra el acceso al panel del evento.',
    icon: ShieldCheck,
    group: 'account',
  },
]

export function sectionInfo(id: AdminSection) {
  return adminSections.find((section) => section.id === id) ?? adminSections[0]
}
