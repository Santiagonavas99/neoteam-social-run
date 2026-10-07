import { eventIcs } from '@/features/event/calendar'

export function GET() {
  return new Response(eventIcs(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="neoteam-social-run.ics"',
    },
  })
}
