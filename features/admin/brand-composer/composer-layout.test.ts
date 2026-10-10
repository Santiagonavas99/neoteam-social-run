import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  compositionFormats,
  containRect,
  logoSlots,
  type CompositionFormat,
  type CompositionLayout,
} from './composer-layout.ts'

test('all supported social formats have the expected export dimensions', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(compositionFormats).map(([key, value]) => [key, [value.width, value.height]])),
    {
      square: [1080, 1080],
      portrait: [1080, 1350],
      'three-four': [1080, 1440],
      story: [1080, 1920],
      landscape: [1920, 1080],
    },
  )
})

test('17 allied brands fit within every format and layout without overlap', () => {
  const formats = Object.keys(compositionFormats) as CompositionFormat[]
  const layouts: CompositionLayout[] = ['bottom', 'grid', 'center']
  for (const format of formats) {
    const { width, height } = compositionFormats[format]
    for (const layout of layouts) {
      const tiles = logoSlots(width, height, 17, layout, 0.92)
      assert.equal(tiles.length, 17)
      for (const [i, a] of tiles.entries()) {
        assert.ok(a.x >= 0 && a.y >= 0 && a.width > 0 && a.height > 0, format)
        assert.ok(a.x + a.width <= width && a.y + a.height <= height, format)
        for (const b of tiles.slice(i + 1)) {
          const overlap = a.x < b.x + b.width && b.x < a.x + a.width
            && a.y < b.y + b.height && b.y < a.y + a.height
          assert.equal(overlap, false, `${format} ${layout}: logos overlap`)
        }
      }
    }
  }
})

test('empty selections do not render extra logos; invalid counts fail fast', () => {
  assert.deepEqual(logoSlots(1080, 1350, 0, 'bottom'), [])
  assert.throws(() => logoSlots(1080, 1350, -1, 'bottom'))
  assert.throws(() => logoSlots(0, 1350, 1, 'bottom'))
})

test('image is contained without distorting the original aspect ratio', () => {
  const rect = { x: 0, y: 0, width: 160, height: 100 }
  const wide = containRect(400, 100, rect)
  const tall = containRect(100, 400, rect)
  assert.equal(wide.width / wide.height, 4)
  assert.equal(tall.width / tall.height, 0.25)
  assert.ok(wide.width <= rect.width && wide.height <= rect.height)
  assert.ok(tall.width <= rect.width && tall.height <= rect.height)
})
