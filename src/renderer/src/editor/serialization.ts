import type { Editor } from '@milkdown/kit/core'
import { remarkStringifyOptionsCtx } from '@milkdown/kit/core'
import { remarkPreserveEmptyLinePlugin } from '@milkdown/kit/preset/commonmark'
import { $remark } from '@milkdown/kit/utils'
import { imageBlockSchema } from '@milkdown/kit/component/image-block'
import { visitParents } from 'unist-util-visit-parents'
import type { Root } from 'mdast'

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

export function configureSerialization(editor: Editor): Editor {
  editor.remove(remarkPreserveEmptyLinePlugin)
  editor.use(remarkPreserveEmptyLineSafe)
  editor.use(imageBlockKeepAlt)
  editor.config((ctx) => {
    ctx.update(remarkStringifyOptionsCtx, (prev) => ({
      ...prev,
      bullet: '-' as const,
      listItemIndent: 'one' as const,
      fences: true,
      rule: '-' as const,
      tablePipeAlign: false
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
