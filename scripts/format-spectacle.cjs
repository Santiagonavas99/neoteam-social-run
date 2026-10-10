const { execFileSync } = require('node:child_process')
const { readFileSync } = require('node:fs')
const files = [
  'features/dynamics/game-scene.ts',
  'features/dynamics/game-scene.test.ts',
  'features/dynamics/game-screen.tsx',
  'features/dynamics/game-screen.module.css',
]
try {
  execFileSync('./node_modules/.bin/biome', ['check', '--write', ...files], {
    stdio: 'pipe',
  })
} catch (error) {
  console.log('SPECTACLE_BIOME_ERROR|' + String(error.stderr ?? error.message).slice(0, 4000))
}
for (const path of files) {
  const encoded = readFileSync(path).toString('base64')
  const total = Math.ceil(encoded.length / 1100)
  for (let i = 0; i < total; i++) {
    console.log('SPECTACLE_CHUNK|' + path + '|' + i + '|' + total + '|' + encoded.slice(i * 1100, (i + 1) * 1100))
  }
}
