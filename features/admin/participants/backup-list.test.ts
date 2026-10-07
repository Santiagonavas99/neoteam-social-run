import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Participant } from '../types.ts'
import { backupListCsv, backupListFileName } from './backup-list.ts'

const base: Participant = {
  id: '1',
  first_name: 'Ana',
  last_name: 'Ruiz',
  email: 'ana@example.com',
  phone: '3001234567',
  document_type: 'CC',
  document_number: '1234567',
  registration_code: 'SR26-00001',
  running_groups: { name: 'NeoTeam' },
  shirt_size: 'M',
  status: 'registered',
}

const lines = (csv: string) => csv.split('\r\n')

function line(csv: string, index: number) {
  const value = lines(csv)[index]
  assert.ok(value !== undefined, `line ${index} exists`)
  return value
}

test('starts with a BOM and the header, separated by semicolons', () => {
  const csv = backupListCsv([base])
  assert.ok(csv.startsWith('﻿Código;Apellidos;Nombres;Documento;'))
  assert.equal(line(csv, 1), 'SR26-00001;Ruiz;Ana;CC 1234567;NeoTeam;M;Inscrito;;')
})

test('sorts by last name, then first name, ignoring accents and case', () => {
  const csv = backupListCsv([
    { ...base, id: '2', last_name: 'Zapata', first_name: 'Luis' },
    { ...base, id: '3', last_name: 'álvarez', first_name: 'Sofía' },
    { ...base, id: '4', last_name: 'Álvarez', first_name: 'Andrés' },
  ])
  assert.deepEqual(
    lines(csv)
      .slice(1)
      .map((line) => line.split(';')[2]),
    ['Andrés', 'Sofía', 'Luis'],
  )
})

test('quotes separators, quotes and line breaks, and neutralizes formulas', () => {
  const csv = backupListCsv([
    {
      ...base,
      first_name: 'Ana; "La Rápida"',
      last_name: '=HYPERLINK("x")',
      other_running_group: null,
    },
  ])
  const row = line(csv, 1)
  assert.ok(row.includes(`"'=HYPERLINK(""x"")"`))
  assert.ok(row.includes('"Ana; ""La Rápida"""'))
})

test('shows the check-in time and keeps cancelled runners with their state', () => {
  const csv = backupListCsv([
    { ...base, status: 'checked_in', checked_in_at: '2026-10-18T12:42:00Z' },
    {
      ...base,
      id: '2',
      last_name: 'Soto',
      status: 'cancelled',
      running_groups: null,
      other_running_group: null,
    },
  ])
  assert.match(line(csv, 1), /;Check-in;7:42\sa\.\sm\.;$/)
  assert.match(line(csv, 2), /;Independiente;M;Cancelado;;$/)
})

test('names the file with the Bogotá date and time', () => {
  assert.equal(
    backupListFileName(new Date('2026-10-18T11:05:00Z')),
    'social-run-inscritos-2026-10-18-0605.csv',
  )
})
