import { describe, it, expect } from 'vitest'
import { markdownToBodyHtml, hydrateInBrowser, wrapDocument } from '../src/renderer/src/export/html'
import { resolveAssetUrl } from '../src/renderer/src/export/assets'

describe('exportación a HTML', () => {
  it('renderiza tabla GFM, tareas y código', async () => {
    const html = await markdownToBodyHtml(
      '| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] hecho\n\n```js\nconst x = 1\n```\n'
    )
    expect(html).toContain('<table>')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('hljs-keyword')
  })

  it('convierte mermaid en placeholder y luego lo hidrata', async () => {
    const body = await markdownToBodyHtml('```mermaid\nflowchart LR\n A-->B\n```\n')
    expect(body).toContain('data-mermaid')
    const out = await hydrateInBrowser(body, {
      css: '',
      renderMermaid: async () => '<svg id="ok"></svg>'
    })
    expect(out).toContain('<svg id="ok">')
    expect(out).not.toContain('data-mermaid')
  })

  it('muestra el frontmatter como bloque', async () => {
    const html = await markdownToBodyHtml('---\nname: x\n---\n\n# T\n')
    expect(html).toContain('class="frontmatter"')
    expect(html).toContain('name: x')
  })

  it('renderiza KaTeX', async () => {
    const html = await markdownToBodyHtml('$E=mc^2$')
    expect(html).toContain('class="katex"')
  })

  it('embebe imágenes por callback', async () => {
    const body = await markdownToBodyHtml('![a](./img/a.png)')
    const out = await hydrateInBrowser(body, {
      css: '',
      inlineImage: async (src) => (src.endsWith('a.png') ? 'data:image/png;base64,AAA' : null)
    })
    expect(out).toContain('src="data:image/png;base64,AAA"')
  })

  it('envuelve en documento completo con título escapado', () => {
    const doc = wrapDocument('<p>x</p>', { title: 'a<b', css: 'body{}' })
    expect(doc).toContain('<title>a&lt;b</title>')
    expect(doc).toContain('<article class="lumen-doc">')
  })
})

describe('resolución de rutas de imagen', () => {
  it('convierte relativas a lumen://', () => {
    expect(resolveAssetUrl('./img/a.png', '/Users/x/docs')).toBe(
      'lumen://file//Users/x/docs/img/a.png'
    )
    expect(resolveAssetUrl('../a.png', '/Users/x/docs')).toBe('lumen://file//Users/x/a.png')
  })
  it('deja remotas y data intactas', () => {
    expect(resolveAssetUrl('https://a/b.png', '/x')).toBe('https://a/b.png')
    expect(resolveAssetUrl('data:image/png;base64,AA', '/x')).toBe('data:image/png;base64,AA')
  })
  it('sin baseDir deja la relativa igual', () => {
    expect(resolveAssetUrl('a.png', null)).toBe('a.png')
  })
})
