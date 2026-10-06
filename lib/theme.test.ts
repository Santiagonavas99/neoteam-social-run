import assert from 'node:assert/strict'
import test from 'node:test'
import { parseThemeChoice, resolveTheme, THEME_KEY, themeScript } from './theme.ts'

test('anything but light or dark falls back to system', () => {
  assert.equal(parseThemeChoice('dark'), 'dark')
  assert.equal(parseThemeChoice('light'), 'light')
  assert.equal(parseThemeChoice(null), 'system')
  assert.equal(parseThemeChoice('blue'), 'system')
})

test('system follows the device, explicit choices win', () => {
  assert.equal(resolveTheme('system', true), 'dark')
  assert.equal(resolveTheme('system', false), 'light')
  assert.equal(resolveTheme('light', true), 'light')
  assert.equal(resolveTheme('dark', false), 'dark')
})

test('the pre-paint script reads the same storage key', () => {
  assert.ok(themeScript.includes(`'${THEME_KEY}'`))
})
