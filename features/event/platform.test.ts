import assert from 'node:assert/strict'
import test from 'node:test'
import { isAndroidPlatform, isApplePlatform, isIOSPlatform } from './platform.ts'

const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
const iphone =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15'
const ipad =
  'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15'
const android =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36'

test('iOS detection only matches iPhone, iPad, and iPod user agents', () => {
  assert.equal(isIOSPlatform(iphone), true)
  assert.equal(isIOSPlatform(ipad), true)
  assert.equal(isIOSPlatform(android), false)
  assert.equal(isIOSPlatform(`${mac} (KHTML, like Gecko) Version/18.0 Safari/605.1.15`), false)
  assert.equal(
    isIOSPlatform(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36',
    ),
    false,
  )
})

test('Android detection only matches Android user agents', () => {
  assert.equal(isAndroidPlatform(android), true)
  assert.equal(isAndroidPlatform(iphone), false)
  assert.equal(isAndroidPlatform(`${mac} (KHTML, like Gecko) Chrome/129.0 Safari/537.36`), false)
})

test('Apple devices and Safari count as Apple', () => {
  for (const agent of [
    iphone,
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) CriOS/129.0 Mobile/15E148 Safari/604.1',
    ipad,
    `${mac} (KHTML, like Gecko) Version/18.0 Safari/605.1.15`,
  ]) {
    assert.equal(isApplePlatform(agent), true, agent)
  }
})

test('other browsers, even on a Mac, do not count as Apple', () => {
  for (const agent of [
    `${mac} (KHTML, like Gecko) Chrome/129.0 Safari/537.36`,
    `${mac} (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0`,
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0',
    android,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36',
    '',
  ]) {
    assert.equal(isApplePlatform(agent), false, agent)
  }
})
