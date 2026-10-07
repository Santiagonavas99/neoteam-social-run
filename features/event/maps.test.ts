import assert from 'node:assert/strict'
import test from 'node:test'
import { mapsEmbedUrl, mapsUrl } from './maps.ts'

test('maps links encode the place', () => {
  assert.equal(
    mapsUrl('Parque del Ingenio, Cali'),
    'https://www.google.com/maps/search/?api=1&query=Parque%20del%20Ingenio%2C%20Cali',
  )
  assert.equal(
    mapsEmbedUrl('A & B'),
    'https://www.google.com/maps?q=A%20%26%20B&hl=es&output=embed',
  )
})
