import assert from 'node:assert/strict'
import test from 'node:test'
import { googleWalletPath, isAppleMobile } from './wallet.ts'

test('hides Google Wallet on iPhone and iPad only', () => {
  const agents = {
    iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
    ipad: 'Mozilla/5.0 (iPad; CPU OS 17_6 like Mac OS X) AppleWebKit/605.1.15',
    ipadDesktop:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
    android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/129.0 Mobile',
    desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0',
  }
  assert.equal(isAppleMobile(agents.iphone), true)
  assert.equal(isAppleMobile(agents.ipad), true)
  assert.equal(isAppleMobile(agents.ipadDesktop), false)
  assert.equal(isAppleMobile(agents.android), false)
  assert.equal(isAppleMobile(agents.desktop), false)
  assert.equal(isAppleMobile(''), false)
})

test('the save link carries only the encoded token', () => {
  assert.equal(googleWalletPath('a b'), '/api/wallet/google?token=a%20b')
})
