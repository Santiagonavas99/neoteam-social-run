import { formatTime } from '../../event/datetime.ts'
import { participantStates } from '../labels.ts'
import type { Participant } from '../types.ts'

const HEADER = [
  'Código',
  'Apellidos',
  'Nombres',
  'Documento',
  'Grupo',
  'Talla',
  'Estado',
  'Hora check-in',
  'Llegó',
]

// Excel in Spanish expects ";" and needs the BOM to read UTF-8 accents.
const SEPARATOR = ';'
const BOM = '﻿'

function cell(value: string) {
  // A leading = + - @ would run as a formula when the file is opened (CSV injection).
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return /[";\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

const byName = (a: Participant, b: Participant) =>
  a.last_name.localeCompare(b.last_name, 'es', { sensitivity: 'base' }) ||
  a.first_name.localeCompare(b.first_name, 'es', { sensitivity: 'base' })

export function backupListCsv(rows: Participant[]) {
  const lines = [...rows]
    .sort(byName)
    .map((row) =>
      [
        row.registration_code ?? '',
        row.last_name,
        row.first_name,
        `${row.document_type} ${row.document_number}`,
        row.running_groups?.name || row.other_running_group || 'Independiente',
        row.shirt_size ?? '',
        participantStates[row.status] ?? row.status,
        row.status === 'checked_in' && row.checked_in_at ? formatTime(row.checked_in_at) : '',
        '',
      ]
        .map(cell)
        .join(SEPARATOR),
    )
  return BOM + [HEADER.join(SEPARATOR), ...lines].join('\r\n')
}

const stamp = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function backupListFileName(now: Date) {
  const part = Object.fromEntries(stamp.formatToParts(now).map(({ type, value }) => [type, value]))
  return `social-run-inscritos-${part.year}-${part.month}-${part.day}-${part.hour}${part.minute}.csv`
}
