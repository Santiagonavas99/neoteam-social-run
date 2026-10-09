import type { Participant } from '../types.ts'

export type PrintableRegistration = {
  name: string
  crew: string
}

export function printableRegistrations(rows: Participant[]): PrintableRegistration[] {
  return rows
    .filter((row) => row.status !== 'cancelled')
    .map((row) => ({
      name: [row.first_name, row.last_name].filter(Boolean).join(' ').trim(),
      crew: row.running_groups?.name || row.other_running_group || 'Independiente',
      surname: row.last_name,
      givenName: row.first_name,
    }))
    .sort(
      (a, b) =>
        a.surname.localeCompare(b.surname, 'es', { sensitivity: 'base' }) ||
        a.givenName.localeCompare(b.givenName, 'es', { sensitivity: 'base' }),
    )
    .map(({ name, crew }) => ({ name, crew }))
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] ?? char)
}

// Print documents deliberately contain only names and crews, never other participant fields.
export function printableRegistrationsHtml(rows: Participant[]): string {
  const registrations = printableRegistrations(rows)
  const body = registrations
    .map(
      ({ name, crew }) =>
        `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(crew)}</td></tr>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lista de inscritos · Social Run</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body { color: #111; background: #fff; font-family: Arial, sans-serif; font-size: 12px; margin: 0; }
  h1 { font-size: 22px; margin: 0 0 18px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { text-align: left; background: #eee; }
  th, td { border-bottom: 1px solid #bbb; padding: 9px 8px; overflow-wrap: anywhere; }
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
  th:first-child, td:first-child { width: 52%; }
</style>
</head>
<body>
  <h1>Inscritos · Social Run</h1>
  <table>
    <thead><tr><th scope="col">Nombre</th><th scope="col">Running crew</th></tr></thead>
    <tbody>${body || '<tr><td colspan="2">No hay inscritos para imprimir.</td></tr>'}</tbody>
  </table>
</body>
</html>`
}
