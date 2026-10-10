import assert from 'node:assert/strict'
import { test } from 'node:test'
import { nameFromLogoFilename } from './logo-name.ts'

test('suggests editable names from descriptive logo files', () => {
  assert.equal(nameFromLogoFilename('logo-Media_Maraton_Cali.webp'), 'Media Maraton Cali')
  assert.equal(nameFromLogoFilename('Neo-Running.png'), 'Neo Running')
})

test('avoids meaningless camera filenames', () => {
  assert.equal(nameFromLogoFilename('IMG_8833.JPG'), '')
  assert.equal(nameFromLogoFilename('WhatsApp Image 2026.png'), '')
})
