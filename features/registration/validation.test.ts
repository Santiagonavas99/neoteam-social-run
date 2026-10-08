import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  digitsOnlyInput,
  isAllowedBirthDate,
  isEmailDomainValid,
  isNumericDocumentType,
  isValidDocumentNumber,
  MIN_BIRTH_DATE,
  maxBirthDate,
  normalizeColombianPhone,
} from './validation.ts'

test('birth dates must exist and stay between 1900 and the current date in Colombia', () => {
  assert.equal(MIN_BIRTH_DATE, '1900-01-01')
  assert.equal(maxBirthDate(new Date('2026-10-09T02:30:00Z')), '2026-10-08')
  assert.equal(isAllowedBirthDate('1900-01-01', '2026-10-08'), true)
  assert.equal(isAllowedBirthDate('1881-05-03', '2026-10-08'), false)
  assert.equal(isAllowedBirthDate('2026-10-09', '2026-10-08'), false)
  assert.equal(isAllowedBirthDate('2026-02-30', '2026-10-08'), false)
  assert.equal(isAllowedBirthDate('2024-02-29', '2026-10-08'), true)
})

test('email requires a public domain with a TLD', () => {
  for (const email of ['ana@gmail.com', 'ana+run@univalle.edu.co', 'ana@running.travel']) {
    assert.equal(isEmailDomainValid(email), true, email)
  }
  for (const email of [
    'ana@',
    'ana@localhost',
    'ana@dominio',
    'ana@-gmail.com',
    'ana@gmail..com',
    'ana@gmail.c',
    'ana@gmail.123',
  ]) {
    assert.equal(isEmailDomainValid(email), false, email)
  }
})

test('numeric identification rejects letters without rejecting alphanumeric passports', () => {
  for (const type of ['CC', 'CE', 'TI', 'PPT']) {
    assert.equal(isNumericDocumentType(type), true)
    assert.equal(isValidDocumentNumber('1234567', type), true)
    assert.equal(isValidDocumentNumber('ssasassa', type), false)
  }
  assert.equal(isNumericDocumentType('PA'), false)
  assert.equal(isValidDocumentNumber('AB123456', 'PA'), true)
  assert.equal(isValidDocumentNumber('123', 'PA'), false)
  assert.equal(isValidDocumentNumber('123 456', 'OTRO'), false)
})

test('numeric-only inputs discard letters and formatting on paste and autofill', () => {
  assert.equal(digitsOnlyInput('sasa'), '')
  assert.equal(digitsOnlyInput('300abc1234567'), '3001234567')
  assert.equal(digitsOnlyInput('+57 300 123 4567'), '573001234567')
})

test('phone normalization retains complete Colombian numbers', () => {
  assert.equal(normalizeColombianPhone('+57 300 123 4567'), '3001234567')
  assert.equal(normalizeColombianPhone('601-123-4567'), '6011234567')
})
