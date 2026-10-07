import assert from 'node:assert/strict'
import test from 'node:test'
import { googleWalletPath } from './wallet.ts'

test('the save link carries only the encoded token', () => {
  assert.equal(googleWalletPath('a b'), '/api/wallet/google?token=a%20b')
})
