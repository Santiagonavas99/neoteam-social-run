import {
  CalendarClock,
  Flag,
  GalleryHorizontal,
  Layers3,
  LayoutDashboard,
  ListOrdered,
  type LucideIcon,
  Mail,
  Tag,
  UserCheck,
  UserCog,
  Users,
  Zap,
} from 'lucide-react'
import type { StaffRole } from './types'

export type AdminSection =
  | 'checkin'
  | 'metrics'
  | 'home-order'
  | 'logos'
  | 'brand-composer'
  | 'participants'
  | 'registration-settings'
  | 'email-queue'
  | 'groups'
  | 'brands'
  | 'dynamics'
  | 'team'

export type AdminSectionGroup = 'event' | 'content' | 'account'

export type AdminSectionInfo = {
  id: AdminSection
  label: string
  description: string
  icon: LucideIcon
  group: AdminSectionGroup
  primary?: true
  /** Also open to check-in staff; every other section is admin only. */
  staff?: true
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
    id: 'registration-settings',
    label: 'Inscripciones',
    description: 'Configura la fecha y hora límite y abre o cierra el formulario.',
    icon: CalendarClock,
    group: 'event',
  },
  {
    id: 'checkin',
    label: 'Check-in',
    description: 'Escanea el QR o escribe el código de cada corredor.',
    icon: UserCheck,
    group: 'event',
    primary: true,
    staff: true,
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
    id: 'email-queue',
    label: 'Correos pendientes',
    description: 'Recupera pases no enviados y prepara una tanda manual para el día siguiente.',
    icon: Mail,
    group: 'event',
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
    id: 'home-order',
    label: 'Orden de la Home',
    description: 'Ordena las secciones y muestra u oculta las que necesites.',
    icon: ListOrdered,
    group: 'content',
  },
  {
    id: 'brand-composer',
    label: 'Compositor de marcas',
    description: 'Crea piezas con logos aliados y exporta PNG o JPG.',
    icon: Layers3,
    group: 'content',
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
    label: 'Running crews',
    description: 'Configura los crews de la cinta de la página principal.',
    icon: Flag,
    group: 'content',
  },
  {
    id: 'brands',
    label: 'Marcas',
    description: 'Configura marcas y organizaciones para la página principal.',
    icon: Tag,
    group: 'content',
  },
  {
    id: 'team',
    label: 'Equipo',
    description: 'Quién entra al panel y qué puede hacer.',
    icon: UserCog,
    group: 'account',
  },
]

export function sectionsFor(role: StaffRole) {
  return adminSections.filter((section) => role === 'admin' || section.staff)
}

export function sectionInfo(id: AdminSection) {
  return adminSections.find((section) => section.id === id) ?? adminSections[0]
}
