import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import type { Root as MdastRoot } from 'mdast'
import type { Root as HastRoot, Element } from 'hast'

/**
 * Markdown → HTML limpio para exportar (HTML y PDF). Independiente del
 * editor: no raspa el DOM de Milkdown, así el resultado es estable y
 * probable en Node. Mermaid y las imágenes se inyectan por callback porque
 * necesitan DOM / disco.
 */

export interface RenderOptions {
  title?: string
  css: string
  katexCss?: string
  /** Renderiza un bloque mermaid a SVG; null si falla. */
  renderMermaid?: (code: string) => Promise<string | null>
  /** Convierte la URL de una imagen a una forma embebible (data:). null = dejar igual. */
  inlineImage?: (src: string) => Promise<string | null>
  /** Muestra el frontmatter YAML como bloque al inicio. */
  showFrontmatter?: boolean
}

function remarkFrontmatterToCode(show: boolean) {
  return () => (tree: MdastRoot) => {
    visit(tree, 'yaml', (node, index, parent) => {
      if (!parent || index === undefined) return
      if (!show) {
        parent.children.splice(index, 1)
        return
      }
      parent.children.splice(index, 1, {
        type: 'code',
        lang: 'yaml',
        value: node.value,
        data: { hProperties: { className: ['frontmatter'] } }
      })
    })
  }
}

function rehypeMermaidPlaceholders() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return
      const code = node.children[0]
      if (!code || code.type !== 'element' || code.tagName !== 'code') return
      const classes = (code.properties?.['className'] as string[] | undefined) ?? []
      if (!classes.includes('language-mermaid')) return
      const text = code.children.map((c) => (c.type === 'text' ? c.value : '')).join('')
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['mermaid'], 'data-mermaid': text },
        children: []
      }
    })
  }
}

function rehypeFrontmatterClass() {
  return (tree: HastRoot) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'pre') return
      const code = node.children[0]
      if (code?.type !== 'element' || code.tagName !== 'code') return
      const classes = (code.properties?.['className'] as string[] | undefined) ?? []
      if (classes.includes('frontmatter'))
        node.properties = { ...node.properties, className: ['frontmatter'] }
    })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function markdownToBodyHtml(
  markdown: string,
  opts: Pick<RenderOptions, 'showFrontmatter'> = {}
): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkFrontmatterToCode(opts.showFrontmatter ?? true))
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeFrontmatterClass)
    .use(rehypeMermaidPlaceholders)
    .use(rehypeKatex)
    .use(rehypeHighlight, { detect: false, ignoreMissing: true } as never)
    .use(rehypeStringify)
    .process(markdown)
  return String(file)
}

/** Sustituye placeholders de Mermaid e imágenes usando el DOM del renderer. */
export async function hydrateInBrowser(bodyHtml: string, opts: RenderOptions): Promise<string> {
  const container = document.createElement('div')
  container.innerHTML = bodyHtml

  if (opts.renderMermaid) {
    for (const el of Array.from(
      container.querySelectorAll<HTMLElement>('div.mermaid[data-mermaid]')
    )) {
      const code = el.dataset['mermaid'] ?? ''
      const svg = await opts.renderMermaid(code)
      if (svg) el.innerHTML = svg
      else el.innerHTML = `<pre><code>${escapeHtml(code)}</code></pre>`
      delete el.dataset['mermaid']
    }
  }
  if (opts.inlineImage) {
    for (const img of Array.from(container.querySelectorAll('img'))) {
      const src = img.getAttribute('src')
      if (!src) continue
      const data = await opts.inlineImage(src)
      if (data) img.setAttribute('src', data)
    }
  }
  return container.innerHTML
}

export function wrapDocument(bodyHtml: string, opts: RenderOptions): string {
  const title = escapeHtml(opts.title ?? 'Documento')
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${opts.katexCss ?? ''}</style>
<style>${opts.css}</style>
</head>
<body>
<article class="lumen-doc">
${bodyHtml}
</article>
</body>
</html>
`
}
