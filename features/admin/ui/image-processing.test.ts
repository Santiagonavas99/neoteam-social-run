import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  fallbackImageMime,
  fitImageDimensions,
  isImageInput,
  MAX_IMAGE_BYTES,
  prepareImageForUpload,
} from './image-processing.ts'

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

test('fallback preserves potentially transparent logos while photos use JPEG', () => {
  assert.equal(fallbackImageMime({ name: 'logo.png', type: 'image/png' }), 'image/png')
  assert.equal(fallbackImageMime({ name: 'logo.webp', type: 'image/webp' }), 'image/png')
  assert.equal(fallbackImageMime({ name: 'logo.avif', type: 'image/avif' }), 'image/png')
  assert.equal(fallbackImageMime({ name: 'phone.heic', type: 'image/heic' }), 'image/jpeg')
  assert.equal(fallbackImageMime({ name: 'phone.jpg', type: 'image/jpeg' }), 'image/jpeg')
})

/**
 * Mock the browser conversion pipeline to reproduce mobile Safari returning
 * image/png from canvas.toBlob(..., 'image/webp').
 */
function browserWithEncoder(encode: (mime: string) => Blob | null) {
  const imageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image')
  const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const createUrl = URL.createObjectURL
  const revokeUrl = URL.revokeObjectURL
  const formats: string[] = []

  class FakeImage {
    naturalWidth = 1400
    naturalHeight = 800
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_value: string) {
      this.onload?.()
    }
  }

  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'high',
      clearRect: () => {},
      drawImage: () => {},
    }),
    toBlob: (callback: (blob: Blob | null) => void, mime: string) => {
      formats.push(mime)
      callback(encode(mime))
    },
  }
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: FakeImage })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: () => canvas },
  })
  URL.createObjectURL = () => 'blob:mock'
  URL.revokeObjectURL = () => {}

  return {
    formats,
    restore: () => {
      if (imageDescriptor) Object.defineProperty(globalThis, 'Image', imageDescriptor)
      else Reflect.deleteProperty(globalThis, 'Image')
      if (documentDescriptor) Object.defineProperty(globalThis, 'document', documentDescriptor)
      else Reflect.deleteProperty(globalThis, 'document')
      URL.createObjectURL = createUrl
      URL.revokeObjectURL = revokeUrl
    },
  }
}

test('returns optimized WebP when the mobile browser supports encoding', async () => {
  const browser = browserWithEncoder((mime) => new Blob(['encoded'], { type: mime }))
  try {
    const image = new File(['jpeg bytes'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await prepareImageForUpload(image)
    assert.equal(result.mime, 'image/webp')
    assert.equal(result.webp, true)
    assert.deepEqual(browser.formats, ['image/webp'])
  } finally {
    browser.restore()
  }
})

test('Safari PNG fallback no longer prevents a small transparent PNG upload', async () => {
  const browser = browserWithEncoder(() => new Blob(['fallback'], { type: 'image/png' }))
  try {
    const file = new File(['png bytes'], 'logo.png', { type: 'image/png' })
    const result = await prepareImageForUpload(file)
    assert.equal(result.mime, 'image/png')
    assert.equal(result.webp, false)
    assert.equal(result.blob, file)
    assert.deepEqual(browser.formats, ['image/webp'])
  } finally {
    browser.restore()
  }
})

test('HEIC on mobile falls back to resized JPEG when WebP encoder is unsupported', async () => {
  const browser = browserWithEncoder((mime) =>
    new Blob(['small image'], { type: mime === 'image/webp' ? 'image/png' : mime }),
  )
  try {
    const file = new File(['heic bytes'], 'photo.heic', { type: 'image/heic' })
    const result = await prepareImageForUpload(file)
    assert.equal(result.mime, 'image/jpeg')
    assert.equal(result.webp, false)
    assert.deepEqual(browser.formats, ['image/webp', 'image/jpeg'])
  } finally {
    browser.restore()
  }
})

test('oversized JPEG has a bounded fallback under the server upload limit', async () => {
  const browser = browserWithEncoder((mime) =>
    new Blob(['small image'], { type: mime === 'image/webp' ? 'image/png' : mime }),
  )
  try {
    const file = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'large.jpg', {
      type: 'image/jpeg',
    })
    const result = await prepareImageForUpload(file)
    assert.equal(result.mime, 'image/jpeg')
    assert.ok(result.blob.size <= MAX_IMAGE_BYTES)
  } finally {
    browser.restore()
  }
})
