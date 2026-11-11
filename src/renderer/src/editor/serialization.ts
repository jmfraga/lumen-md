import type { Editor } from '@milkdown/kit/core'
import { remarkStringifyOptionsCtx } from '@milkdown/kit/core'
import { remarkPreserveEmptyLinePlugin } from '@milkdown/kit/preset/commonmark'
import { $remark } from '@milkdown/kit/utils'
import { imageBlockSchema } from '@milkdown/kit/component/image-block'
import { visitParents } from 'unist-util-visit-parents'
import type { Parent, Root, Text } from 'mdast'

/**
 * Reglas de serialización pensadas para fidelidad con los .md que generan las
 * herramientas de IA (viñetas `-`, tablas sin relleno, wikilinks intactos).
 */

const BR = new Set(['<br />', '<br>', '<br >', '<br/>'])

/**
 * Milkdown trae un plugin que borra TODOS los nodos html `<br>` del árbol
 * (los usa como marcador de párrafo vacío). Eso destruye los `<br>` inline
 * legítimos. Esta versión solo quita el `<br>` cuando es el único hijo de
 * un párrafo, que es el caso que Milkdown mismo genera.
 */
export const remarkPreserveEmptyLineSafe = $remark(
  'remarkPreserveEmptyLineSafe',
  () => () => (tree: Root) => {
    visitParents(
      tree,
      (node) => node.type === 'html' && BR.has(((node as { value?: string }).value ?? '').trim()),
      (node, parents) => {
        const parent = parents[parents.length - 1] as
          { type: string; children: unknown[] } | undefined
        if (!parent || parent.type !== 'paragraph' || parent.children.length !== 1) return
        parent.children.splice(parent.children.indexOf(node), 1)
      },
      true
    )
  }
)

/**
 * `$` de dinero, no de fórmula. remark-math toma `MX$2,025 … MX$17,900` como
 * fórmula en línea. Aplicamos la regla de Pandoc: no es fórmula si el
 * contenido empieza o termina con espacio, o si el `$` de cierre va pegado a
 * un dígito. `$E = mc^2$` sigue siendo fórmula.
 */
export const remarkDollarNotMath = $remark(
  'remarkDollarNotMath',
  () => () => (tree: Root, file: { value?: unknown }) => {
    const source = typeof file?.value === 'string' ? file.value : String(file?.value ?? '')
    visitParents(
      tree,
      (node) => node.type === 'inlineMath',
      (node, parents) => {
        const parent = parents[parents.length - 1] as Parent
        const i = parent.children.indexOf(node as never)
        const start = node.position?.start.offset
        const end = node.position?.end.offset
        // remark-math recorta un espacio por lado: el texto original dice la verdad.
        const raw =
          start !== undefined && end !== undefined
            ? source.slice(start, end)
            : `$${(node as { value: string }).value}$`
        if (raw.startsWith('$$')) return
        const inner = raw.slice(1, -1)
        const after = end !== undefined ? source.charAt(end) : ''
        if (inner && !/^\s|\s$/.test(inner) && !/\d/.test(after)) return
        // Vuelve a ser texto, unido con sus vecinos.
        const prev = parent.children[i - 1]
        const next = parent.children[i + 1]
        let text = raw
        let from = i
        let count = 1
        if (prev?.type === 'text') {
          text = prev.value + text
          from--
          count++
        }
        if (next?.type === 'text') {
          text += next.value
          count++
        }
        parent.children.splice(from, count, { type: 'text', value: text } as Text)
      },
      true
    )
  }
)

const TEXT_BLOCKS = new Set(['paragraph', 'heading', 'tableCell'])
/** Marca de texto cuyo bloque tiene un solo `$`: nadie puede emparejarlo, no hace falta escaparlo. */
const BARE_DOLLAR = 'lumenBareDollar'

function countDollars(node: { type: string; value?: string; children?: unknown[] }): number {
  if (node.type === 'text') return (node.value?.match(/\$/g) ?? []).length
  if (node.type === 'inlineMath') return 2
  if (node.type === 'inlineCode') return 0
  return (node.children ?? []).reduce<number>((n, c) => n + countDollars(c as never), 0)
}

function markBareDollars(node: { type: string; children?: unknown[]; data?: unknown }): void {
  if (TEXT_BLOCKS.has(node.type)) {
    if (countDollars(node) > 1) return
    visitParents(node as Root, 'text', (t) => {
      t.data = { ...t.data, [BARE_DOLLAR]: true } as never
    })
    return
  }
  for (const c of node.children ?? []) markBareDollars(c as never)
}

/** Antes de escribir el Markdown, marca los bloques con un solo `$` (ver `textHandler`). */
export const remarkMarkBareDollars = $remark(
  'remarkMarkBareDollars',
  () =>
    function (this: unknown) {
      const self = this as { compiler?: (tree: Root, file: unknown) => unknown }
      const compile = self.compiler
      if (!compile) return
      self.compiler = (tree, file) => {
        markBareDollars(tree)
        return compile(tree, file)
      }
    }
)

const PLACEHOLDER = '\uE000'

/**
 * Texto con escapes mínimos:
 * - `$`: solo se escapa si hay otro `$` en el mismo bloque. Con dos o más,
 *   Obsidian o GitHub podrían leerlos como fórmula, así que `\$` es lo seguro.
 * - `[nota]` sin `(url)`, `[ref]` ni `:` después no es enlace y no necesita `\[`.
 */
export function textHandler(
  node: Text,
  parent: Parent | undefined,
  state: { safe: (value: string, info: unknown) => string },
  info: unknown
): string {
  const bare = Boolean((node.data as Record<string, unknown> | undefined)?.[BARE_DOLLAR])
  let out = state.safe(bare ? node.value.replace(/\$/g, PLACEHOLDER) : node.value, info)
  if (bare) out = out.replace(/\uE000/g, '$')
  const hasNext = parent ? parent.children.indexOf(node) < parent.children.length - 1 : false
  return unescapePlainBrackets(out, hasNext)
}

/** `\[nota]` → `[nota]` cuando no puede formar enlace, definición ni casilla de tarea. */
export function unescapePlainBrackets(out: string, hasNextSibling: boolean): string {
  return out.replace(/\\\[([^[\]\n]*)\]/g, (m, inner: string, at: number) => {
    const after = out[at + m.length]
    if (after === '(' || after === '[' || after === ']' || after === ':') return m
    if (after === undefined && hasNextSibling) return m
    if (at === 0 && /^[ xX]$/.test(inner)) return m
    return `[${inner}]`
  })
}

export function configureSerialization(editor: Editor): Editor {
  editor.remove(remarkPreserveEmptyLinePlugin)
  editor.use(remarkPreserveEmptyLineSafe)
  editor.use(remarkDollarNotMath)
  editor.use(remarkMarkBareDollars)
  editor.use(imageBlockKeepAlt)
  editor.config((ctx) => {
    ctx.update(remarkStringifyOptionsCtx, (prev) => ({
      ...prev,
      bullet: '-' as const,
      listItemIndent: 'one' as const,
      fences: true,
      rule: '-' as const,
      tablePipeAlign: false,
      handlers: { ...prev.handlers, text: textHandler as never }
    }))
  })
  return editor
}

/**
 * Deshace escapes que remark-stringify aplica por precaución pero que
 * cambian el significado para otras herramientas (wikilinks de Obsidian).
 */
export function postProcessMarkdown(md: string): string {
  return md.replace(/\\\[\\\[([^\]\n]+)\]\]/g, '[[$1]]')
}

/**
 * El bloque de imagen de Milkdown guarda la PROPORCIÓN en el `alt` del
 * Markdown (`![1.00](foto.png)`) y descarta el texto alternativo original.
 * Para documentos de IA eso destruye pies como `![Figura 1: flujo](...)`.
 * Aquí conservamos el alt textual y solo usamos el número cuando no hay texto.
 */
export const imageBlockKeepAlt = imageBlockSchema.extendSchema((prev) => (ctx) => {
  const base = prev(ctx)
  return {
    ...base,
    attrs: { ...(base.attrs ?? {}), alt: { default: '' } },
    parseMarkdown: {
      match: base.parseMarkdown.match,
      runner: (state, node, type) => {
        const raw = typeof node['alt'] === 'string' ? (node['alt'] as string) : ''
        const isRatio = /^\d+(\.\d+)?$/.test(raw)
        let ratio = isRatio ? Number(raw) : 1
        if (Number.isNaN(ratio) || ratio === 0) ratio = 1
        state.addNode(type, {
          src: node['url'],
          caption: typeof node['title'] === 'string' ? node['title'] : '',
          ratio,
          alt: isRatio ? '' : raw
        })
      }
    },
    toMarkdown: {
      match: base.toMarkdown.match,
      runner: (state, node) => {
        const alt = typeof node.attrs['alt'] === 'string' ? (node.attrs['alt'] as string) : ''
        const ratio = Number.parseFloat(node.attrs['ratio'])
        const ratioText = Number.isNaN(ratio) || Math.abs(ratio - 1) < 0.005 ? '' : ratio.toFixed(2)
        state.openNode('paragraph')
        state.addNode('image', undefined, undefined, {
          title: node.attrs['caption'] || undefined,
          url: node.attrs['src'],
          alt: alt || ratioText
        })
        state.closeNode()
      }
    }
  }
})
