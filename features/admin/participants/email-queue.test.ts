import assert from 'node:assert/strict'
import test from 'node:test'
import {
  batchRecipients,
  EMAIL_BATCH_SIZE,
  emailFailureLabel,
  type PendingEmail,
} from './email-queue.ts'

const recipient = (index: number): PendingEmail => ({
  id: String(index),
  registration_number: index,
  first_name: 'Corredor',
  last_name: String(index),
  email: `corredor${index}@example.com`,
  created_at: new Date(2026, 9, 8).toISOString(),
  pass_email_last_error: null,
  pass_email_last_attempt_at: null,
})

test('manual batch is capped at 10 even with 25 visible recipients', () => {
  const rows = Array.from({ length: 25 }, (_, index) => recipient(index + 1))
  assert.equal(EMAIL_BATCH_SIZE, 10)
  assert.deepEqual(
    batchRecipients(rows).map((r) => r.registration_number),
    Array.from({ length: 10 }, (_, index) => index + 1),
  )
  assert.equal(batchRecipients([]).length, 0)
})

test('rate-limited emails have an actionable diagnosis', () => {
  assert.equal(emailFailureLabel('rate_limited'), 'Límite diario de Resend')
  assert.equal(emailFailureLabel('connection_error'), 'Error de conexión')
})
