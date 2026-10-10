import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  clampLogoZone,
  moveLogoZone,
  recommendedColumns,
  type TemplateColumns,
  templateLogoSlots,
  verticalAlliesZone,
} from './composer-template.ts'

test('adaptive template chooses the agreed distribution for changing brands', () => {
  const expectations: [number, number, number][] = [
    [1, 1, 1],
    [4, 2, 2],
    [6, 3, 2],
    [8, 4, 2],
    [9, 3, 3],
    [12, 4, 3],
    [16, 4, 4],
    [17, 5, 4],
    [24, 5, 5],
  ]
  for (const [count, columns, rows] of expectations) {
    assert.equal(recommendedColumns(count), columns)
    const slots = templateLogoSlots(1080, 1440, count, verticalAlliesZone, 'auto', 0.012)
    assert.equal(slots.length, count)
    assert.equal(new Set(slots.map((rect) => rect.y)).size, rows)
  }
})

test('cards stay inside the reserved area without overlapping for 1–80 logos', () => {
  const formats: [number, number][] = [
    [1080, 1440],
    [1080, 1920],
    [1080, 1350],
    [1920, 1080],
  ]
  const modes: TemplateColumns[] = ['auto', 2, 3, 4, 5]
  for (const [width, height] of formats) {
    for (const columns of modes) {
      for (const count of [1, 4, 6, 12, 16, 17, 24, 40, 80]) {
        const slots = templateLogoSlots(width, height, count, verticalAlliesZone, columns, 0.008)
        const left = Math.floor(verticalAlliesZone.x * width) - 1
        const top = Math.floor(verticalAlliesZone.y * height) - 1
        const right = (verticalAlliesZone.x + verticalAlliesZone.width) * width + 1
        const bottom = (verticalAlliesZone.y + verticalAlliesZone.height) * height + 1
        for (let i = 0; i < slots.length; i++) {
          const a = slots[i]
          assert.ok(a && a.width > 0 && a.height > 0)
          assert.ok(a.x >= left && a.y >= top)
          assert.ok(a.x + a.width <= right && a.y + a.height <= bottom)
          for (const b of slots.slice(i + 1)) {
            if (!b) continue
            const overlaps: boolean =
              a.x < b.x + b.width &&
              b.x < a.x + a.width &&
              a.y < b.y + b.height &&
              b.y < a.y + a.height
            assert.equal(overlaps, false, `${width}x${height}, ${count}, ${columns}`)
          }
        }
      }
    }
  }
})

test('move and resize clamps the safe area into the canvas', () => {
  assert.deepEqual(moveLogoZone(verticalAlliesZone, 0.8, 0.8, false), {
    ...verticalAlliesZone,
    x: 0.14,
    y: 0.6,
  })
  assert.deepEqual(clampLogoZone({ x: -1, y: -1, width: 2, height: 2 }), {
    x: 0,
    y: 0,
    width: 0.98,
    height: 0.9,
  })
  const resized = moveLogoZone(verticalAlliesZone, -0.5, 0.2, true)
  assert.ok(Math.abs(resized.width - 0.36) < 0.000001)
  assert.ok(resized.height > verticalAlliesZone.height)
  assert.throws(() => templateLogoSlots(1080, 1440, -1, verticalAlliesZone, 'auto', 0.01))
  assert.deepEqual(templateLogoSlots(1080, 1440, 0, verticalAlliesZone, 'auto', 0.01), [])
})
