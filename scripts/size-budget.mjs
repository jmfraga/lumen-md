// Presupuesto de tamaño: Lumen es ligero a propósito. Falla si un bundle crece de más.
// Si una función nueva necesita más espacio, sube el límite a propósito y explícalo en el PR.
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

const KB = 1024
const budgets = [
  { label: 'main', file: 'out/main/index.js', maxKB: 64 },
  { label: 'preload', file: 'out/preload/index.js', maxKB: 16 },
  {
    label: 'renderer principal',
    dir: 'out/renderer/assets',
    match: /^index-.*\.js$/,
    maxKB: 7 * 1024
  }
]

let failed = false
for (const b of budgets) {
  let size = 0
  if (b.file) size = statSync(b.file).size
  else
    size = Math.max(
      ...readdirSync(b.dir)
        .filter((f) => b.match.test(f))
        .map((f) => statSync(join(b.dir, f)).size)
    )
  const kb = Math.round(size / KB)
  const ok = kb <= b.maxKB
  if (!ok) failed = true
  console.log(`${ok ? '✓' : '✗'} ${b.label}: ${kb} KB (límite ${b.maxKB} KB)`)
}
if (failed) {
  console.error('\nPresupuesto de tamaño excedido. Lumen debe seguir siendo ligero.')
  process.exit(1)
}
