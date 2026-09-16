import { describe, it, expect, beforeAll } from 'vitest'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { roundTrip } from './helpers/roundtrip'

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
  beforeAll(() => {
    // ProseMirror necesita medidas de layout que jsdom no implementa.
    class NoopObserver {
      observe(): void {
        /* jsdom no implementa observers; no hacen falta para serializar */
      }
      unobserve(): void {
        /* noop */
      }
      disconnect(): void {
        /* noop */
      }
      takeRecords(): never[] {
        return []
      }
    }
    ;(globalThis as { IntersectionObserver?: unknown }).IntersectionObserver ??= NoopObserver
    ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= NoopObserver
    if (!Range.prototype.getClientRects) {
      Range.prototype.getClientRects = () =>
        ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as never
      Range.prototype.getBoundingClientRect = () =>
        ({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          toJSON: () => ({})
        }) as DOMRect
    }
  })

  for (const file of files) {
    it(file, async () => {
      const original = readFileSync(join(corpusDir, file), 'utf8')
      const out = await roundTrip(original)
      expect(normalize(out)).toBe(normalize(original))
    })
  }
})
