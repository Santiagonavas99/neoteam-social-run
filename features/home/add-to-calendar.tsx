import { CalendarPlus } from 'lucide-react'
import { headers } from 'next/headers'
import { googleCalendarUrl } from '@/features/event/calendar'
import { isApplePlatform } from '@/features/event/platform'

// Apple Calendar opens the .ics sheet; everyone else gets Google Calendar.
export async function AddToCalendar() {
  const apple = isApplePlatform((await headers()).get('user-agent') ?? '')
  const content = (
    <>
      <CalendarPlus aria-hidden className="size-4 shrink-0" />
      Agregar a mi agenda
    </>
  )
  return apple ? (
    <a href="/evento.ics" className="button button-secondary">
      {content}
    </a>
  ) : (
    <a
      href={googleCalendarUrl()}
      target="_blank"
      rel="noopener"
      className="button button-secondary"
    >
      {content}
    </a>
  )
}
