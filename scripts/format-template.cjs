const { execFileSync } = require('node:child_process')
const { readFileSync } = require('node:fs')
const files = [
  'features/admin/brand-composer/brand-composer-view.tsx',
  'features/admin/brand-composer/composer-renderer.ts',
  'features/admin/brand-composer/composer-template.test.ts',
  'features/admin/brand-composer/composer-template.ts',
  'features/admin/brand-composer/template-zone-overlay.tsx',
  'features/admin/sections.ts',
]
try {
  execFileSync('./node_modules/.bin/biome', ['check', '--write', ...files], { stdio: 'pipe' })
} catch (error) {
  console.log('FORMAT_TEMPLATE_WARN|' + String(error.stderr ?? error.message).slice(0, 2200))
}
for (const path of files) {
  const encoded = readFileSync(path).toString('base64')
  const total = Math.ceil(encoded.length / 1000)
  for (let index = 0; index < total; index++) {
    console.log('TEMPLATE_CHUNK|' + path + '|' + index + '|' + total + '|' + encoded.slice(index * 1000, (index + 1) * 1000))
  }
}
