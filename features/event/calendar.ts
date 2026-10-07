import { eventConfig } from './event.ts'

const TITLE = `NeoTeam ${eventConfig.name}`
const DETAILS = `${eventConfig.reason}. ${eventConfig.route}. Tu pase: ${eventConfig.url}/pase`

// 2026-10-18T07:30:00-05:00 -> 20261018T123000Z
const utcStamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
const start = utcStamp(new Date(eventConfig.startsAt))
const end = utcStamp(new Date(eventConfig.endsAt))

export function googleCalendarUrl() {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: TITLE,
    dates: `${start}/${end}`,
    details: DETAILS,
    location: eventConfig.location,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

const escapeText = (value: string) => value.replace(/([;,])/g, '\\$1').replace(/\n/g, '\\n')

// RFC 5545 folds lines over 75 octets. ponytail: folds by characters, safe while lines stay mostly ASCII.
const fold = (line: string) => line.match(/.{1,70}/g)?.join('\r\n ') ?? ''

export function eventIcs(now = new Date()) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NeoTeam//Social Run//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:social-run-2026@socialrun.site',
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeText(TITLE)}`,
    `LOCATION:${escapeText(eventConfig.location)}`,
    `DESCRIPTION:${escapeText(DETAILS)}`,
    `URL:${eventConfig.url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(TITLE)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n')
    .concat('\r\n')
}
