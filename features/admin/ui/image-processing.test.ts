import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fitImageDimensions, isImageInput } from './image-processing.ts'

test('keeps the original size when the image is smaller than the target', () => {
  assert.deepEqual(fitImageDimensions(500, 300, 1920), { width: 500, height: 300 })
})

test('resizes landscape and portrait images without stretching or upscaling', () => {
  assert.deepEqual(fitImageDimensions(4000, 2000, 1920), { width: 1920, height: 960 })
  assert.deepEqual(fitImageDimensions(2000, 4000, 1920), { width: 960, height: 1920 })
})

test('allows common raster images and extension-only mobile images', () => {
  assert.equal(isImageInput({ name: 'photo.jpg', type: 'image/jpeg' }), true)
  assert.equal(isImageInput({ name: 'photo.avif', type: 'image/avif' }), true)
  assert.equal(isImageInput({ name: 'photo.HEIC', type: '' }), true)
  assert.equal(isImageInput({ name: 'photo.heif', type: 'application/octet-stream' }), true)
})

test('rejects SVGs and non-images', () => {
  assert.equal(isImageInput({ name: 'logo.svg', type: 'image/svg+xml' }), false)
  assert.equal(isImageInput({ name: 'notes.txt', type: 'text/plain' }), false)
})
