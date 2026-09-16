import { app, BrowserWindow, net, protocol } from 'electron'
import { pathToFileURL } from 'url'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { createWindow } from './windows'
import { registerIpc, openPathInWindow } from './ipc'
import { rebuildMenu } from './menu'

/**
 * Arranque. Tres formas de recibir un archivo:
 *  - macOS: evento `open-file` (Finder, doble clic, arrastrar al Dock).
 *  - Windows/Linux: ruta en argv; con la app ya abierta llega por `second-instance`.
 *  - Desde el renderer: drag & drop o menú Abrir.
 */

// lumen://file/<ruta absoluta> sirve imágenes locales del documento en dev y producción.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'lumen',
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
  }
])

function registerAssetProtocol(): void {
  protocol.handle('lumen', (request) => {
    const url = new URL(request.url)
    if (url.host !== 'file') return new Response('not found', { status: 404 })
    const path = decodeURIComponent(url.pathname)
    if (!existsSync(path)) return new Response('not found', { status: 404 })
    return net.fetch(pathToFileURL(path).toString())
  })
}

const pendingPaths: string[] = []
let ready = false

function markdownPathsFromArgv(argv: string[]): string[] {
  return argv
    .slice(app.isPackaged ? 1 : 2)
    .filter((a) => !a.startsWith('-'))
    .map((a) => resolve(a))
    .filter((p) => existsSync(p))
}

function openOrQueue(path: string): void {
  if (ready) openPathInWindow(path, BrowserWindow.getFocusedWindow())
  else pendingPaths.push(path)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', (_e, argv, cwd) => {
    const paths = markdownPathsFromArgv(argv.map((a) => (a.startsWith('-') ? a : resolve(cwd, a))))
    if (paths.length) paths.forEach(openOrQueue)
    else BrowserWindow.getAllWindows()[0]?.focus()
  })

  app.on('open-file', (e, path) => {
    e.preventDefault()
    openOrQueue(path)
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('mx.docfraga.lumen')
    app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

    registerAssetProtocol()
    registerIpc()
    rebuildMenu()
    ready = true

    const initial = [...markdownPathsFromArgv(process.argv), ...pendingPaths]
    pendingPaths.length = 0
    if (initial.length) initial.forEach((p) => createWindow(p))
    else createWindow(null)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(null)
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
