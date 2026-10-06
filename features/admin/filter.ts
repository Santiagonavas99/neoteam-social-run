export function matchesQuery(fields: (string | null | undefined)[], query: string) {
  return fields.join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())
}
