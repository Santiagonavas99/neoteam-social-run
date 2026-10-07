import { agenda, eventConfig } from './event.ts'

const arrival = agenda[0]

// Shown on the pass bib, its image and the Google Wallet object. The email keeps a Deno copy.
export const passFacts = [
  { id: 'date', label: 'Fecha', value: eventConfig.dateShort },
  { id: 'arrival', label: 'Llegada', value: `${arrival.time} ${arrival.meridiem}` },
  { id: 'place', label: 'Lugar', value: eventConfig.location },
] as const
