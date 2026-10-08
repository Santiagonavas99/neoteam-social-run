import assert from 'node:assert/strict'
import { test } from 'node:test'
import { splitFullName } from './full-name.ts'

test('splits a two-word full name into the existing database fields', () => {
  assert.deepEqual(splitFullName('Ana Pérez'), { firstName: 'Ana', lastName: 'Pérez' })
})

test('preserves compound names and surnames in their original order', () => {
  assert.deepEqual(splitFullName('Ana María Pérez López'), {
    firstName: 'Ana María',
    lastName: 'Pérez López',
  })
  assert.deepEqual(splitFullName('Juan Pérez Gómez'), {
    firstName: 'Juan',
    lastName: 'Pérez Gómez',
  })
})

test('accepts one or two surnames without losing any name words', () => {
  assert.deepEqual(splitFullName('Santiago Navas'), {
    firstName: 'Santiago',
    lastName: 'Navas',
  })
  assert.deepEqual(splitFullName('Santiago Navas López'), {
    firstName: 'Santiago',
    lastName: 'Navas López',
  })
  assert.deepEqual(splitFullName('Santiago Andrés Navas López'), {
    firstName: 'Santiago Andrés',
    lastName: 'Navas López',
  })
  assert.deepEqual(splitFullName('María del Carmen Pérez Rodríguez'), {
    firstName: 'María del Carmen',
    lastName: 'Pérez Rodríguez',
  })
})

test('normalizes whitespace without changing spelling', () => {
  assert.deepEqual(splitFullName('  José   Andrés  Niño\tGarcía  '), {
    firstName: 'José Andrés',
    lastName: 'Niño García',
  })
})

test('requires at least a given name and a surname', () => {
  assert.equal(splitFullName(''), null)
  assert.equal(splitFullName('  Lucía  '), null)
})
