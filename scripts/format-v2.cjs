// Temporary CI helper for obtaining exactly Biome-formatted V2 file contents.
// Removed after importing the formatted files. Never touches production.
const { execFileSync } = require('node:child_process')
const { readFileSync } = require('node:fs')

const paths = [
  'features/admin/dynamics/dynamic-create-wizard.tsx',
  'features/admin/dynamics/dynamics-view.tsx',
  'features/admin/dynamics/game-control-panel.tsx',
  'features/dynamics/game-screen.tsx',
  'features/dynamics/game-state.ts',
  'features/dynamics/game-state.test.ts',
  'app/api/juego/[id]/route.ts',
  'app/juego/[id]/page.tsx',
  'features/admin/types.ts',
]
try {
  execFileSync('./node_modules/.bin/biome', ['check', '--write', ...paths], {
    stdio: 'pipe',
  })
} catch (error) {
  console.log('BIOME_FORMAT_RESULT: ' + String(error.stderr ?? error.message).slice(0, 2000))
}
for (const path of paths) {
  console.log('DYNAMICS_FORMAT_FILE|' + path + '|' + readFileSync(path).toString('base64'))
}
