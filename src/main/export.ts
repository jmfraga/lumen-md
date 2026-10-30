import { app, BrowserWindow } from 'electron'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { join } from 'path'

/**
 * Exportación. El renderer ya entrega un HTML autocontenido (CSS inline,
 * Mermaid como SVG, KaTeX renderizado); aquí solo lo escribimos o lo
 * imprimimos a PDF en una ventana oculta.
 */

export async function writeHtml(path: string, html: string): Promise<void> {
  await writeFile(path, html, 'utf8')
}

export async function writePdf(path: string, html: string): Promise<void> {
  // Archivo temporal y no data: URL — Chromium corta las URL de ~2 MB y un
  // documento con varias imágenes embebidas las rebasa. Sin JavaScript: el HTML
  // exportado ya viene renderizado y un <script> del .md no debe correr aquí.
  const dir = await mkdtemp(join(app.getPath('temp'), 'lumen-pdf-'))
  const tmp = join(dir, 'export.html')
  await writeFile(tmp, html, 'utf8')
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      javascript: false
    }
  })
  try {
    await win.loadFile(tmp)
    // Damos tiempo a fuentes e imágenes embebidas.
    await new Promise((r) => setTimeout(r, 300))
    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      margins: { top: 0.6, bottom: 0.6, left: 0.6, right: 0.6 }
    })
    await writeFile(path, pdf)
  } finally {
    win.destroy()
    await rm(dir, { recursive: true, force: true })
  }
}
