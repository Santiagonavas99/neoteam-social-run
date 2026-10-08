import assert from 'node:assert/strict'
import { test } from 'node:test'
import { RUNNING_GROUP_OPTIONS } from './running-groups.ts'
import { registrationSchema } from './schema.ts'

const valid = {
  firstName: 'Ana',
  lastName: 'Pérez',
  documentType: 'CC',
  documentNumber: '1234567',
  email: 'ana@example.com',
  phone: '3001234567',
  birthDate: '1995-04-12',
  gender: 'female',
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

test('accepts every listed running crew', () => {
  for (const group of RUNNING_GROUP_OPTIONS) {
    assert.equal(
      registrationSchema.safeParse({ ...valid, runningGroup: group.value }).success,
      true,
      group.label,
    )
  }
})

test('uses the canonical database slugs for listed crews', () => {
  assert.deepEqual(
    RUNNING_GROUP_OPTIONS.map((group) => group.value),
    [
      'byrunners',
      'el-cartel-running-club',
      'run-365',
      'neoteam',
      'pacific-runners',
      'beer-runners',
      'integral-fit',
      'running-social',
      'united-runner-club',
      'guabinas-run-club',
      'pace-running',
    ],
  )
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

test('accepts 10-digit mobile and landline numbers', () => {
  assert.equal(registrationSchema.safeParse({ ...valid, phone: '3001234567' }).success, true)
  assert.equal(
    registrationSchema.safeParse({ ...valid, emergencyPhone: '6011234567' }).success,
    true,
  )
})

test('normalizes autofilled and formatted phones to 10 digits', () => {
  for (const phone of ['+57 300 123 4567', '300-123-4567', '(300) 123 4567']) {
    const result = registrationSchema.safeParse({ ...valid, phone })
    assert.equal(result.success && result.data.phone, '3001234567', phone)
  }
})

test('rejects phones that are not 10 digits', () => {
  for (const phone of ['300123456', '30012345678', 'abc']) {
    assert.deepEqual(errorPaths({ ...valid, phone }), ['phone'], phone)
    assert.deepEqual(errorPaths({ ...valid, emergencyPhone: phone }), ['emergencyPhone'], phone)
  }
})

test('requires the category to be female or male', () => {
  assert.deepEqual(errorPaths({ ...valid, gender: undefined }), ['gender'])
  assert.deepEqual(errorPaths({ ...valid, gender: 'other' }), ['gender'])
  assert.deepEqual(errorPaths({ ...valid, gender: 'male' }), [])
})
