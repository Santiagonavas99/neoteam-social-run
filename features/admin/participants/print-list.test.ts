import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Participant } from '../types.ts'
import { printableRegistrations, printableRegistrationsHtml } from './print-list.ts'

const base: Participant = {
  id: '1',
  first_name: 'Ana',
  last_name: 'Ruiz',
  email: 'sensitive@example.com',
  phone: '3001234567',
  document_type: 'CC',
  document_number: '987654321',
  registration_code: 'SR26-SECRET',
  running_groups: { name: 'NeoTeam' },
  status: 'registered',
}

test('prints only names and crews, never documents, contact details or codes', () => {
  const html = printableRegistrationsHtml([base])
  assert.match(html, /<th scope="col">Nombre<\/th><th scope="col">Running crew<\/th>/)
  assert.match(html, /<td>Ana Ruiz<\/td><td>NeoTeam<\/td>/)
  for (const sensitive of [
    base.email,
    base.phone,
    base.document_number,
    base.registration_code,
    'Documento',
    'Correo',
    'Cédula',
  ]) {
    assert.ok(!html.includes(sensitive ?? ''), `Must never print ${sensitive}`)
  }
})

test('sorts by surname and falls back to independent or custom crew', () => {
  const rows = printableRegistrations([
    { ...base, id: '1', first_name: 'Luis', last_name: 'Zapata', running_groups: null },
    {
      ...base,
      id: '2',
      first_name: 'María',
      last_name: 'Álvarez',
      running_groups: null,
      other_running_group: 'Los Rápidos',
    },
    { ...base, id: '3', first_name: 'Ana', last_name: 'Ruiz' },
  ])
  assert.deepEqual(rows, [
    { name: 'María Álvarez', crew: 'Los Rápidos' },
    { name: 'Ana Ruiz', crew: 'NeoTeam' },
    { name: 'Luis Zapata', crew: 'Independiente' },
  ])
})

test('excludes cancelled registrations while keeping check-in and not-attended', () => {
  const html = printableRegistrationsHtml([
    { ...base, id: '1', first_name: 'Cancelado', status: 'cancelled' },
    { ...base, id: '2', first_name: 'Confirmado', status: 'registered' },
    { ...base, id: '3', first_name: 'Llegó', status: 'checked_in' },
    { ...base, id: '4', first_name: 'Ausente', status: 'no_show' },
  ])
  assert.doesNotMatch(html, /Cancelado Ruiz/)
  assert.match(html, /Confirmado Ruiz/)
  assert.match(html, /Llegó Ruiz/)
  assert.match(html, /Ausente Ruiz/)
})

test('escapes HTML from user-provided names and crews instead of executing it', () => {
  const html = printableRegistrationsHtml([
    {
      ...base,
      first_name: '<script>alert(1)</script>',
      last_name: "O'Brian",
      running_groups: null,
      other_running_group: 'Amigos & "Runners"',
    },
  ])
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.match(html, /O&#39;Brian/)
  assert.match(html, /Amigos &amp; &quot;Runners&quot;/)
  assert.ok(!html.includes('<script>alert(1)</script>'))
})
