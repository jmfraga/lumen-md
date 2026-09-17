import { describe, it, expect, beforeAll } from 'vitest'
import { Crepe } from '@milkdown/crepe'
import { frontmatter } from '../src/renderer/src/editor/frontmatter'
import { configureSerialization } from '../src/renderer/src/editor/serialization'
import { insert, insertTable, MERMAID_TEMPLATE } from '../src/renderer/src/editor/insert'
import type { InsertKind } from '../src/renderer/src/editor/insert'

async function withEditor(fn: (crepe: Crepe) => void): Promise<string> {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const crepe = new Crepe({ root, defaultValue: 'Hola' })
  crepe.editor.use(frontmatter)
  configureSerialization(crepe.editor)
  await crepe.create()
  try {
    fn(crepe)
    return crepe.getMarkdown()
  } finally {
    await crepe.destroy()
    root.remove()
  }
}

describe('inserciones desde el menú', () => {
  beforeAll(() => {
    class NoopObserver {
      observe(): void {
        /* jsdom */
      }
      unobserve(): void {
        /* jsdom */
      }
      disconnect(): void {
        /* jsdom */
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

  const cases: Array<[InsertKind, string]> = [
    ['h2', '## '],
    ['quote', '> '],
    ['bullet-list', '- '],
    ['ordered-list', '1. '],
    ['task-list', '- [ ] '],
    ['code', '```'],
    ['divider', '---']
  ]
  for (const [kind, expected] of cases) {
    it(`${kind} produce ${JSON.stringify(expected)}`, async () => {
      const md = await withEditor((c) => c.editor.action((ctx) => insert(ctx, kind)))
      expect(md).toContain(expected)
    })
  }

  it('tabla con filas y columnas elegidas', async () => {
    const md = await withEditor((c) => c.editor.action((ctx) => insertTable(ctx, 2, 3)))
    const rows = md.split('\n').filter((l) => l.trim().startsWith('|'))
    expect(rows.length).toBe(3) // encabezado + separador + 1 fila
    expect(rows[0].split('|').length - 2).toBe(3)
  })

  it('mermaid inserta un bloque con plantilla', async () => {
    const md = await withEditor((c) => c.editor.action((ctx) => insert(ctx, 'mermaid')))
    expect(md).toContain('```mermaid')
    expect(md).toContain(MERMAID_TEMPLATE.split('\n')[0])
  })
})
