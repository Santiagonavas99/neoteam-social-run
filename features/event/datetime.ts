const timeFormat = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  timeStyle: 'short',
})

export function formatTime(iso: string) {
  return timeFormat.format(new Date(iso))
}
