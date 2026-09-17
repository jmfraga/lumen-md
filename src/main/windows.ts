import { app, BrowserWindow, shell, dialog, nativeTheme } from 'electron'
import { writeFile } from 'fs/promises'
import { join, basename } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

/**
 * Una ventana por documento. Aquí vive el estado que main necesita conocer
 * de cada ventana: ruta del archivo y si tiene cambios sin guardar.
 */

interface WindowState {
  filePath: string | null
  dirty: boolean
  /** Ruta con la que se creó la ventana; el renderer la pide al arrancar. */
  initialPath: string | null
}

const states = new WeakMap<BrowserWindow, WindowState>()

export function stateOf(win: BrowserWindow): WindowState {
  let s = states.get(win)
  if (!s) {
    s = { filePath: null, dirty: false, initialPath: null }
    states.set(win, s)
  }
  return s
}

export function findWindowForPath(path: string): BrowserWindow | undefined {
  return BrowserWindow.getAllWindows().find((w) => stateOf(w).filePath === path)
}

function updateTitle(win: BrowserWindow): void {
  const s = stateOf(win)
  const name = s.filePath ? basename(s.filePath) : 'Sin título'
  win.setTitle(`${s.dirty ? '• ' : ''}${name} — Lumen`)
  if (process.platform === 'darwin') {
    win.setRepresentedFilename(s.filePath ?? '')
    win.setDocumentEdited(s.dirty)
  }
}

export function setWindowPath(win: BrowserWindow, path: string | null): void {
  stateOf(win).filePath = path
  updateTitle(win)
}

export function setWindowDirty(win: BrowserWindow, dirty: boolean): void {
  stateOf(win).dirty = dirty
  updateTitle(win)
}

export function createWindow(filePath: string | null = null): BrowserWindow {
  // Si el archivo ya está abierto, enfocamos esa ventana en vez de duplicarla.
  if (filePath) {
    const existing = findWindowForPath(filePath)
    if (existing) {
      existing.focus()
      return existing
    }
  }

  const win = new BrowserWindow({
    width: 1000,
    height: 760,
    minWidth: 480,
    minHeight: 320,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 14, y: 14 },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  const s = stateOf(win)
  s.initialPath = filePath
  s.filePath = filePath
  updateTitle(win)

  win.on('ready-to-show', () => win.show())

  // Herramienta de desarrollo/CI: LUMEN_SCREENSHOT=/ruta.png captura la ventana y sale.
  const shotPath = process.env['LUMEN_SCREENSHOT']
  if (shotPath) {
    // LUMEN_THEME=dark|light fuerza el tema en capturas.
    const theme = process.env['LUMEN_THEME']
    if (theme === 'dark' || theme === 'light') nativeTheme.themeSource = theme
    win.webContents.once('did-finish-load', () => {
      setTimeout(
        async () => {
          try {
            // LUMEN_SCREENSHOT_JS: código a ejecutar antes de capturar (p. ej. seleccionar texto).
            const pre = process.env['LUMEN_SCREENSHOT_JS']
            if (pre) {
              console.log('[lumen] pre-js →', await win.webContents.executeJavaScript(pre))
              await new Promise((r) => setTimeout(r, 600))
            }
            const image = await win.webContents.capturePage()
            await writeFile(shotPath, image.toPNG())
            console.log(`[lumen] captura guardada en ${shotPath}`)
          } catch (err) {
            console.error('[lumen] captura falló', err)
          } finally {
            app.exit(0)
          }
        },
        Number(process.env['LUMEN_SCREENSHOT_DELAY'] ?? 2500)
      )
    })
  }

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  // Navegar dentro de la ventana nunca; los enlaces externos van al navegador.
  win.webContents.on('will-navigate', (e, url) => {
    e.preventDefault()
    if (/^https?:/.test(url)) shell.openExternal(url)
  })

  win.on('close', (e) => {
    if (!stateOf(win).dirty) return
    const choice = dialog.showMessageBoxSync(win, {
      type: 'warning',
      buttons: ['Guardar', 'Descartar', 'Cancelar'],
      defaultId: 0,
      cancelId: 2,
      message: '¿Guardar los cambios antes de cerrar?',
      detail: 'Si descartas, los cambios sin guardar se perderán.'
    })
    if (choice === 2) {
      e.preventDefault()
      return
    }
    if (choice === 0) {
      e.preventDefault()
      // El renderer guarda y, al confirmar dirty=false, volvemos a cerrar.
      win.webContents.send('lumen:command', 'save')
      const onDirty = (): void => {
        if (!stateOf(win).dirty) {
          clearInterval(timer)
          win.close()
        }
      }
      const timer = setInterval(onDirty, 100)
      setTimeout(() => clearInterval(timer), 10_000)
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return win
}
