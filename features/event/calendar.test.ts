import assert from 'node:assert/strict'
import test from 'node:test'
import { eventIcs, googleCalendarUrl } from './calendar.ts'

test('Google Calendar link carries the UTC times and the place', () => {
  const url = new URL(googleCalendarUrl())
  assert.equal(url.searchParams.get('action'), 'TEMPLATE')
  assert.equal(url.searchParams.get('dates'), '20261018T123000Z/20261018T160000Z')
  assert.equal(url.searchParams.get('location'), 'Parque del Ingenio, Cali')
})

test('the .ics file is valid RFC 5545 text', () => {
  const ics = eventIcs(new Date('2026-10-01T00:00:00Z'))
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'))
  assert.equal(ics.split('\r\n').filter((line) => line.includes('\n')).length, 0)
  assert.ok(ics.includes('\r\nDTSTART:20261018T123000Z\r\n'))
  assert.ok(ics.includes('\r\nDTSTAMP:20261001T000000Z\r\n'))
  assert.ok(ics.includes('\r\nLOCATION:Parque del Ingenio\\, Cali\r\n'))
  assert.ok(ics.includes('TRIGGER:-P1D'))
  for (const line of ics.split('\r\n')) assert.ok(line.length <= 75, line)
})
