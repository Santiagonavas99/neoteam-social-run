import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canAdvanceDemo, gameScene, REVEAL_SUSPENSE_MS } from './game-scene.ts'
import { demoGame } from './game-state.ts'

const stamp = Date.parse('2026-10-09T12:00:00Z')
const time = new Date(stamp).toISOString()

test('ready, countdown and anticipation present no participant names', () => {
  assert.deepEqual(gameScene({ ...demoGame, phase: 'ready' }, stamp), { kind: 'ready' })
  assert.deepEqual(gameScene({ ...demoGame, phase: 'countdown', updatedAt: time }, stamp), {
    kind: 'countdown',
    remaining: 3,
  })
  assert.deepEqual(gameScene({ ...demoGame, phase: 'countdown', updatedAt: time }, stamp + 3100), {
    kind: 'anticipation',
  })
})

test('a live winner remains out of the displayed scene during suspense', () => {
  const first = demoGame.winners.slice(0, 1)
  const game = { ...demoGame, updatedAt: time, shownCount: 1, winners: first }
  const scene = gameScene(game, stamp + REVEAL_SUSPENSE_MS - 1)
  assert.deepEqual(scene, { kind: 'suspense', rank: 1, previous: [] })
  assert.equal(JSON.stringify(scene).includes('Participante de prueba 1'), false)
  assert.equal(canAdvanceDemo(game, stamp + REVEAL_SUSPENSE_MS - 1), false)
  assert.deepEqual(gameScene(game, stamp + REVEAL_SUSPENSE_MS), {
    kind: 'winner',
    winner: first[0],
    previous: [],
  })
})

test('prior winners remain shown while the next one builds suspense', () => {
  const game = {
    ...demoGame,
    updatedAt: time,
    shownCount: 2,
    winners: demoGame.winners.slice(0, 2),
  }
  const scene = gameScene(game, stamp + 1000)
  assert.deepEqual(scene, {
    kind: 'suspense',
    rank: 2,
    previous: demoGame.winners.slice(0, 1),
  })
  assert.equal(JSON.stringify(scene).includes('Participante de prueba 2'), false)
})

test('no unapproved winners are rendered, including in finished scenes', () => {
  const scene = gameScene({ ...demoGame, phase: 'finished', shownCount: 1 }, stamp)
  assert.deepEqual(scene, { kind: 'finished', winners: demoGame.winners.slice(0, 1) })
  assert.deepEqual(gameScene({ ...demoGame, phase: 'reveal', shownCount: 0, winners: [] }, stamp), {
    kind: 'drawn',
  })
  assert.deepEqual(gameScene({ ...demoGame, type: 'qr' }, stamp), { kind: 'activity' })
})

test('public payload cannot reveal a name before the suspense deadline', () => {
  const waiting = { ...demoGame, updatedAt: time, shownCount: 1, winners: [] }
  assert.deepEqual(gameScene(waiting, stamp + 1000), {
    kind: 'suspense',
    rank: 1,
    previous: [],
  })
  // Even with a slow network response, never reveal a name that was not authorized by the API.
  assert.deepEqual(gameScene(waiting, stamp + REVEAL_SUSPENSE_MS + 1000), {
    kind: 'suspense',
    rank: 1,
    previous: [],
  })
})
