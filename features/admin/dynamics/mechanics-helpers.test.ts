import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatElapsed, rankTimes, remainingStock } from './mechanics-helpers.ts'

test('clock formatter handles centiseconds and long durations', () => {
  assert.equal(formatElapsed(0), '00:00.00')
  assert.equal(formatElapsed(12730), '00:12.73')
  assert.equal(formatElapsed(61230), '01:01.23')
  assert.equal(formatElapsed(3600000), '01:00:00.00')
})

const scores = [
  {id:'a',elapsed_ms:30000,status:'finished' as const},
  {id:'b',elapsed_ms:20000,status:'finished' as const},
  {id:'c',elapsed_ms:30000,status:'finished' as const},
  {id:'d',elapsed_ms:800,status:'running' as const},
]

test('resistance chooses highest, speed chooses lowest, ties share position', () => {
  const resistance = rankTimes(scores,'max')
  assert.deepEqual(resistance.map((x) => [x.run.id,x.place,x.tied]),
    [['a',1,true],['c',1,true],['b',3,false]])
  const speed = rankTimes(scores,'min')
  assert.deepEqual(speed.map((x) => [x.run.id,x.place]),
    [['b',1],['a',2],['c',2]])
  assert.deepEqual(scores.map((x)=>x.id),['a','b','c','d'])
})

test('remaining inventory never goes below zero', () => {
  assert.deepEqual(remainingStock(
    [{id:'media',quantity:2},{id:'inscripcion',quantity:1}],
    [{prize_key:'media'},{prize_key:'media'},{prize_key:'media'},{prize_key:null}],
  ).map((p) => p.remaining),[0,1])
})
