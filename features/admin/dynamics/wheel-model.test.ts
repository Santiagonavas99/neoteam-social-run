import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildWheelSectors, targetRotation } from './wheel-model.ts'

const prize = (id: string, weight: number, remaining = 2) => ({
  id, label: id, quantity: 2, remaining, weight,
})

test('a single real prize renders a full segmented wheel', () => {
  const sectors = buildWheelSectors([prize('inscripcion', 1)], 1)
  assert.equal(sectors.length, 8)
  assert.equal(sectors[0].start, 0)
  assert.equal(sectors.at(-1)?.end, 360)
  assert.ok(sectors.every((sector) => sector.label === 'inscripcion'))
})

test('areas represent server configured probabilities and remaining stock', () => {
  const sectors = buildWheelSectors([prize('camisa', 3),prize('medias', 1),prize('agotado', 2, 0)], 0.8)
  const area = (label: string) => sectors
    .filter((sector) => sector.label === label)
    .reduce((value, sector) => value + sector.end - sector.start, 0)
  assert.ok(Math.abs(area('camisa') - 216) < 1e-6)
  assert.ok(Math.abs(area('medias') - 72) < 1e-6)
  assert.ok(Math.abs(area('Sin premio') - 72) < 1e-6)
  assert.equal(area('agotado'), 0)
})

test('an empty inventory has no fake playable sectors', () => {
  assert.deepEqual(buildWheelSectors([], 1), [])
  assert.deepEqual(buildWheelSectors([prize('a', 1, 0)], 1), [])
})

test('the pointer lands on the outcome determined by the server', () => {
  const sectors = buildWheelSectors([prize('a', 1),prize('b', 1)], 0.6)
  for (const label of ['a','b',null]) {
    const end = targetRotation(sectors, label, 123)
    assert.ok(end !== null)
    const chosen = sectors.find((sector) => {
      const middle = (sector.start + sector.end) / 2
      return Math.abs(((middle + (end as number)) % 360 + 360) % 360) < 1e-5 ||
        Math.abs(((middle + (end as number)) % 360 + 360) % 360 - 360) < 1e-5
    })
    assert.equal(chosen?.label, label ?? 'Sin premio')
  }
  assert.equal(targetRotation(sectors,'missing',0),null)
})
