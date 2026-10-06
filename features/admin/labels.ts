import type { DynamicStatus, DynamicType } from './types'

export const participantStates: Record<string, string> = {
  registered: 'Inscrito',
  checked_in: 'Check-in',
  no_show: 'No asistió',
  cancelled: 'Cancelado',
}

export const brandTypes: Record<string, string> = {
  organizer: 'Organizador',
  main_partner: 'Aliado principal',
  sponsor: 'Patrocinador',
  invited: 'Invitado',
}

export const dynamicStates: Record<DynamicStatus, string> = {
  draft: 'Borrador',
  open: 'Activa',
  closed: 'Cerrada',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

export const dynamicTypes: Record<DynamicType, string> = {
  raffle: 'Sorteo',
  qr: 'Stand',
  checkpoint: 'Checkpoint',
  challenge: 'Reto',
  trivia: 'Trivia',
  mission: 'Misión',
  voting: 'Votación',
  instant_win: 'Premio instantáneo',
  points: 'Puntos',
}

// trivia, mission, voting and points behave like challenge in the engine, so the form hides them.
export const dynamicFormTypes: DynamicType[] = [
  'raffle',
  'qr',
  'checkpoint',
  'challenge',
  'instant_win',
]
