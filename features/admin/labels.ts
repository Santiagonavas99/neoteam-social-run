export const participantStates: Record<string, string> = {
  registered: 'Inscrito',
  checked_in: 'Check-in',
  no_show: 'No asistió',
  cancelled: 'Cancelado',
}

export const raffleStates: Record<string, string> = {
  draft: 'Borrador',
  open: 'Abierta',
  drawn: 'Sorteada',
  cancelled: 'Cancelada',
}

export const brandTypes: Record<string, string> = {
  organizer: 'Organizador',
  main_partner: 'Aliado principal',
  sponsor: 'Patrocinador',
  invited: 'Invitado',
}
