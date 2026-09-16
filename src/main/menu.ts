import { app, BrowserWindow, Menu, shell } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import { basename } from 'path'
import { createWindow } from './windows'
import { openPathInWindow, openFileDialog } from './ipc'
import { clearRecents, getPreferences, getRecents } from './store'

const isMac = process.platform === 'darwin'

function send(command: string): void {
  BrowserWindow.getFocusedWindow()?.webContents.send('lumen:command', command)
}

export function buildMenu(): Menu {
  const recents = getRecents()
  const prefs = getPreferences()

  const recentItems: MenuItemConstructorOptions[] = recents.length
    ? [
        ...recents.map((p) => ({
          label: basename(p),
          sublabel: p,
          click: () => openPathInWindow(p, BrowserWindow.getFocusedWindow())
        })),
        { type: 'separator' as const },
        {
          label: 'Limpiar recientes',
          click: () => {
            clearRecents()
            rebuildMenu()
          }
        }
      ]
    : [{ label: 'Sin archivos recientes', enabled: false }]

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: 'Archivo',
      submenu: [
        { label: 'Nuevo', accelerator: 'CmdOrCtrl+N', click: () => createWindow(null) },
        {
          label: 'Abrir…',
          accelerator: 'CmdOrCtrl+O',
          click: () => openFileDialog(BrowserWindow.getFocusedWindow() ?? undefined)
        },
        { label: 'Abrir reciente', submenu: recentItems },
        { type: 'separator' },
        { label: 'Guardar', accelerator: 'CmdOrCtrl+S', click: () => send('save') },
        { label: 'Guardar como…', accelerator: 'Shift+CmdOrCtrl+S', click: () => send('save-as') },
        { type: 'separator' },
        { label: 'Exportar a HTML…', click: () => send('export-html') },
        { label: 'Exportar a PDF…', accelerator: 'CmdOrCtrl+P', click: () => send('export-pdf') },
        { type: 'separator' },
        {
          label: 'Autoguardado',
          type: 'checkbox',
          checked: prefs.autosave,
          click: () => send('toggle-autosave')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edición',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        {
          label: 'Alternar fuente Markdown',
          accelerator: 'CmdOrCtrl+/',
          click: () => send('toggle-source')
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(app.isPackaged
          ? []
          : [{ type: 'separator' as const }, { role: 'toggleDevTools' as const }])
      ]
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' as const }, { role: 'front' as const }] : [])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Lumen en GitHub',
          click: () => shell.openExternal('https://github.com/jmfraga/lumen-md')
        }
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}

export function rebuildMenu(): void {
  Menu.setApplicationMenu(buildMenu())
}
