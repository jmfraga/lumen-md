import { $node, $remark, $view } from '@milkdown/kit/utils'
import type { NodeView } from '@milkdown/kit/prose/view'
import { Fragment } from '@milkdown/kit/prose/model'
import remarkFrontmatter from 'remark-frontmatter'

/**
 * Frontmatter YAML como bloque propio: se muestra como cabecera plegable y
 * se conserva byte a byte al serializar. Sin esto, Milkdown lo convierte en
 * una línea horizontal más texto y destruye las memorias/notas de Obsidian.
 */

export const remarkFrontmatterPlugin = $remark('remarkFrontmatter', () => remarkFrontmatter, [
  'yaml'
])

export const frontmatterNode = $node('frontmatter', () => ({
  content: 'text*',
  group: 'block',
  code: true,
  defining: true,
  marks: '',
  isolating: true,
  parseDOM: [
    {
      tag: 'pre[data-frontmatter]',
      preserveWhitespace: 'full' as const,
      getContent: (dom, schema) => {
        const text = (dom as HTMLElement).textContent ?? ''
        return Fragment.from(text ? schema.text(text) : [])
      }
    }
  ],
  toDOM: () => ['pre', { 'data-frontmatter': '' }, ['code', 0]],
  parseMarkdown: {
    match: (node) => node.type === 'yaml',
    runner: (state, node, type) => {
      state.openNode(type)
      const value = typeof node['value'] === 'string' ? (node['value'] as string) : ''
      if (value) state.addText(value)
      state.closeNode()
    }
  },
  toMarkdown: {
    match: (node) => node.type.name === 'frontmatter',
    runner: (state, node) => {
      state.addNode('yaml', undefined, node.textContent)
    }
  }
}))

export const frontmatterView = $view(frontmatterNode, () => (): NodeView => {
  const dom = document.createElement('div')
  dom.className = 'lumen-frontmatter'

  const header = document.createElement('button')
  header.type = 'button'
  header.className = 'lumen-frontmatter-toggle'
  header.contentEditable = 'false'
  header.textContent = 'frontmatter'
  header.addEventListener('mousedown', (e) => e.preventDefault())
  header.addEventListener('click', () => dom.classList.toggle('collapsed'))

  const pre = document.createElement('pre')
  const code = document.createElement('code')
  code.spellcheck = false
  pre.appendChild(code)

  dom.append(header, pre)
  return {
    dom,
    contentDOM: code,
    stopEvent: (e) => e.target === header
  }
})

export const frontmatter = [remarkFrontmatterPlugin, frontmatterNode, frontmatterView].flat()
