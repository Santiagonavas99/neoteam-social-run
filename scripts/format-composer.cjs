const { execFileSync } = require('node:child_process')
const { readFileSync } = require('node:fs')

const paths = [
  'features/admin/brand-composer/brand-composer-view.tsx',
  'features/admin/brand-composer/composer-layout.ts',
  'features/admin/brand-composer/composer-layout.test.ts',
  'features/admin/brand-composer/composer-library.ts',
  'features/admin/brand-composer/composer-library.test.ts',
  'features/admin/brand-composer/composer-renderer.ts',
  'features/admin/sections.ts',
  'features/admin/admin-app.tsx',
]
try {
  execFileSync('./node_modules/.bin/biome', ['check', '--write', ...paths], { stdio: 'pipe' })
} catch (error) {
  console.log('COMPOSER_BIOME_WARNING|' + String(error.stderr ?? error.message).slice(0, 1800))
}
for (const path of paths) {
  const encoded = readFileSync(path).toString('base64')
  const total = Math.ceil(encoded.length / 1100)
  for (let i = 0; i < total; i++) {
    console.log('COMPOSER_CHUNK|' + path + '|' + i + '|' + total + '|' + encoded.slice(i * 1100, (i + 1) * 1100))
  }
}
