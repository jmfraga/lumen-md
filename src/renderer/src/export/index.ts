import { markdownToBodyHtml, hydrateInBrowser, wrapDocument } from './html'
import printCss from './print.css?inline'
import katexCss from 'katex/dist/katex.min.css?inline'
import { renderMermaid } from '../editor/mermaid'
import { resolveAssetUrl, toDataUrl, isRemote } from './assets'

/** HTML autocontenido listo para escribir a disco o imprimir a PDF. */
export async function buildExportHtml(
  markdown: string,
  title: string,
  baseDir: string | null
): Promise<string> {
  const body = await markdownToBodyHtml(markdown, { showFrontmatter: true })
  const hydrated = await hydrateInBrowser(body, {
    css: printCss,
    renderMermaid: (code) => renderMermaid(code, false),
    inlineImage: async (src) => {
      if (src.startsWith('data:')) return null
      const url = isRemote(src) ? src : resolveAssetUrl(src, baseDir)
      return toDataUrl(url)
    }
  })
  return wrapDocument(hydrated, { title, css: printCss, katexCss })
}
