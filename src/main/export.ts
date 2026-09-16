import { BrowserWindow } from 'electron'
import { writeFile } from 'fs/promises'

/**
 * Exportación. El renderer ya entrega un HTML autocontenido (CSS inline,
 * Mermaid como SVG, KaTeX renderizado); aquí solo lo escribimos o lo
 * imprimimos a PDF en una ventana oculta.
 */

export async function writeHtml(path: string, html: string): Promise<void> {
  await writeFile(path, html, 'utf8')
}

export async function writePdf(path: string, html: string): Promise<void> {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
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
  }
}
