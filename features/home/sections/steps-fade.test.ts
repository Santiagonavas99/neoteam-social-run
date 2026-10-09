import assert from 'node:assert/strict'
import test from 'node:test'
import { sectionFadeOpacity } from './steps-fade.ts'

test('fades in as the section enters from below the viewport', () => {
  assert.equal(sectionFadeOpacity(800, 2000, 800), 0)
  assert.equal(sectionFadeOpacity(700, 1900, 800), 0.5)
  assert.equal(sectionFadeOpacity(600, 1800, 800), 1)
})

test('fades out as the section leaves through the top of the viewport', () => {
  assert.equal(sectionFadeOpacity(-1500, 200, 800), 1)
  assert.equal(sectionFadeOpacity(-1600, 100, 800), 0.5)
  assert.equal(sectionFadeOpacity(-1700, 0, 800), 0)
})

test('works in reverse scroll direction without replaying reveal animations', () => {
  const exit = sectionFadeOpacity(-1600, 100, 800)
  const returnIntoView = sectionFadeOpacity(-1500, 200, 800)
  assert.ok(returnIntoView > exit)
  assert.equal(returnIntoView, 1)
})

test('keeps long mobile sections fully visible while reading the middle', () => {
  assert.equal(sectionFadeOpacity(-500, 1400, 600), 1)
  assert.equal(sectionFadeOpacity(570, 2470, 600), 0.2)
})

test('does not hide content if viewport geometry cannot be computed', () => {
  assert.equal(sectionFadeOpacity(0, 100, 0), 1)
  assert.equal(sectionFadeOpacity(500, 500, 800), 1)
})
