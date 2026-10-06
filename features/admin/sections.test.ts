import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adminSections, sectionsFor } from './sections.ts'

test('admins see every section', () => {
  assert.equal(sectionsFor('admin').length, adminSections.length)
})

test('check-in staff see only check-in and security, check-in first', () => {
  assert.deepEqual(
    sectionsFor('checkin').map((section) => section.id),
    ['checkin', 'security'],
  )
})
