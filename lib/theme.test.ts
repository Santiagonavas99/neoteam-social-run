import assert from 'node:assert/strict'
import test from 'node:test'
import {
  LEGACY_THEME_KEY,
  parseThemeChoice,
  resolveTheme,
  THEME_KEY,
  themeScript,
} from './theme.ts'

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

test('the pre-paint script reads the site key, then the old admin key', () => {
  assert.ok(themeScript.indexOf(`'${THEME_KEY}'`) < themeScript.indexOf(`'${LEGACY_THEME_KEY}'`))
  assert.ok(themeScript.includes('document.documentElement'))
})
