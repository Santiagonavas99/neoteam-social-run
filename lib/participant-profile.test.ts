import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateParticipantProfile } from './participant-profile.ts'

const valid = {
  first_name: 'Ana',
  last_name: 'Ruiz',
  document_type: 'CC',
  document_number: '12345678',
  email: 'ana@example.com',
  phone: '+57 300 123 4567',
  birth_date: '2000-02-29',
  gender: 'female',
  running_group_id: null,
  other_running_group: null,
  shirt_size: 'M',
  emergency_name: 'Carlos Ruiz',
  emergency_phone: '3007654321',
}

test('normalizes administrative email and Colombian phone', () => {
  const result = validateParticipantProfile({ ...valid, email: '  ANA@EXAMPLE.COM ' })
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.profile.email, 'ana@example.com')
  assert.equal(result.profile.phone, '3001234567')
})

test('refuses wrong document, nonexistent domain suffix, invalid birth date and bad contact', () => {
  for (const update of [
    { document_number: '123ABC' },
    { email: 'ana@example.commmm' },
    { birth_date: '2000-02-30' },
    { emergency_phone: '30012A' },
    { running_group_id: 'not-uuid' },
    { shirt_size: 'XXXL' },
    { first_name: 'A' },
    { other_running_group: 'Otro club', running_group_id: '11111111-1111-1111-1111-111111111111' },
  ]) {
    const result = validateParticipantProfile({ ...valid, ...update })
    assert.equal(result.ok, false, JSON.stringify(update))
  }
})

test('only Mujer and Hombre match the real registration options', () => {
  for (const gender of ['female', 'male']) {
    assert.equal(validateParticipantProfile({ ...valid, gender }).ok, true, gender)
  }
  for (const gender of ['non_binary', 'prefer_not_to_say', 'other']) {
    assert.equal(validateParticipantProfile({ ...valid, gender }).ok, false, gender)
  }
})

test('allows registered groups, custom crews and missing optional birth date', () => {
  const existing = validateParticipantProfile({
    ...valid,
    running_group_id: '11111111-1111-1111-1111-111111111111',
    birth_date: '',
  })
  assert.equal(existing.ok, true)
  const custom = validateParticipantProfile({ ...valid, other_running_group: 'Mi Crew' })
  assert.equal(custom.ok, true)
})

test('cannot modify internal fields through the profile parser', () => {
  const result = validateParticipantProfile({
    ...valid,
    pass_emailed_at: '2026-10-08T12:00:00Z',
    status: 'cancelled',
    terms_accepted: false,
    registration_code: 'HACKED',
  })
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(Object.hasOwn(result.profile, 'pass_emailed_at'), false)
  assert.equal(Object.hasOwn(result.profile, 'status'), false)
  assert.equal(Object.hasOwn(result.profile, 'terms_accepted'), false)
})
