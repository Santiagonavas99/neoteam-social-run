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
  console.log('SPECTACLE_FILE|' + path + '|' + readFileSync(path).toString('base64'))
}
