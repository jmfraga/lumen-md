import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { roundTrip } from './helpers/roundtrip'
import './helpers/jsdom-layout'

/**
 * Fidelidad: cada archivo del corpus pasa por Milkdown (parse → serialize)
 * y debe volver igual, salvo normalizaciones triviales. Ver ALLOWED.md.
 */

const corpusDir = join(__dirname, 'fidelity', 'corpus')
const files = readdirSync(corpusDir)
  .filter((f) => f.endsWith('.md'))
  .sort()

export function normalize(md: string): string {
  return (
    md
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((l) => l.replace(/[ \t]+$/, ''))
      // Título de imagen/enlace: 'x' y "x" son equivalentes en Markdown.
      .map((l) => l.replace(/\((\S+) '([^']*)'\)/g, '($1 "$2")'))
      // Filas de tabla: el relleno de espacios y el largo de los guiones no cambian el contenido.
      .map((l) =>
        /^\s*\|.*\|\s*$/.test(l) ? l.replace(/\s*\|\s*/g, '|').replace(/-{2,}/g, '-') : l
      )
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

describe('fidelidad del round-trip Markdown', () => {
  for (const file of files) {
    it(file, async () => {
      const original = readFileSync(join(corpusDir, file), 'utf8')
      const out = await roundTrip(original)
      expect(normalize(out)).toBe(normalize(original))
    })
  }
})
