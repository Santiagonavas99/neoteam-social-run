import assert from 'node:assert/strict'
import { test } from 'node:test'
import { registrationSchema } from './registration-schema.ts'

const valid = {
  firstName: 'Ana',
  lastName: 'Pérez',
  documentType: 'CC',
  documentNumber: '1234567',
  email: 'ana@example.com',
  phone: '3001234567',
  birthDate: '1995-04-12',
  runningGroup: 'neoteam',
  emergencyName: 'Luis Pérez',
  emergencyPhone: '3007654321',
  termsAccepted: 'on',
  privacyAccepted: 'on',
}

function errorPaths(input: Record<string, unknown>) {
  const result = registrationSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

test('accepts a complete registration', () => {
  assert.equal(registrationSchema.safeParse(valid).success, true)
})

test('trims names before checking their length', () => {
  assert.deepEqual(errorPaths({ ...valid, firstName: '  A  ' }), ['firstName'])
})

test('requires the group name when the group is "otro"', () => {
  assert.deepEqual(errorPaths({ ...valid, runningGroup: 'otro' }), ['otherRunningGroup'])
  assert.deepEqual(errorPaths({ ...valid, runningGroup: 'otro', otherRunningGroup: '   ' }), [
    'otherRunningGroup',
  ])
  assert.equal(
    registrationSchema.safeParse({ ...valid, runningGroup: 'otro', otherRunningGroup: 'Crew 5K' })
      .success,
    true,
  )
})

test('rejects an invalid email, a bad birth date and unchecked consents', () => {
  assert.deepEqual(errorPaths({ ...valid, email: 'ana@' }), ['email'])
  assert.deepEqual(errorPaths({ ...valid, birthDate: '12/04/1995' }), ['birthDate'])
  const { termsAccepted: _terms, privacyAccepted: _privacy, ...withoutConsents } = valid
  assert.deepEqual(errorPaths(withoutConsents).sort(), ['privacyAccepted', 'termsAccepted'])
})

test('rejects an unknown document type', () => {
  assert.deepEqual(errorPaths({ ...valid, documentType: 'XX' }), ['documentType'])
})
