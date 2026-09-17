import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { basename, dirname, join } from 'path'
import { IPC } from '../shared/ipc'
import type { OpenedFile, SaveResult, ExportResult, Preferences, AssetResult } from '../shared/ipc'
import { ASSETS_DIR, uniqueAssetName } from '../shared/assets'
import { createWindow, setWindowDirty, setWindowPath, stateOf } from './windows'
import { addRecent, getPreferences, setPreferences } from './store'
import { writeHtml, writePdf } from './export'
import { rebuildMenu } from './menu'

const MD_FILTERS = [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdx', 'txt'] }]

function senderWindow(
  e: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent
): BrowserWindow | null {
  return BrowserWindow.fromWebContents(e.sender)
}

export async function readMarkdown(path: string): Promise<OpenedFile> {
  const content = await readFile(path, 'utf8')
  addRecent(path)
  rebuildMenu()
  return { path, content }
}

export async function openFileDialog(parent?: BrowserWindow): Promise<void> {
  const opts: Electron.OpenDialogOptions = {
    properties: ['openFile', 'multiSelections'],
    filters: MD_FILTERS
  }
  const result = parent
    ? await dialog.showOpenDialog(parent, opts)
    : await dialog.showOpenDialog(opts)
  if (result.canceled) return
  for (const p of result.filePaths) openPathInWindow(p, parent)
}

/** Abre una ruta: reutiliza la ventana si está vacía y limpia, si no crea otra. */
export function openPathInWindow(path: string, preferred?: BrowserWindow | null): BrowserWindow {
  if (preferred && !preferred.isDestroyed()) {
    const s = stateOf(preferred)
    if (!s.filePath && !s.dirty) {
      s.initialPath = path
      setWindowPath(preferred, path)
      preferred.webContents.send(IPC.openPathEvent, path)
      return preferred
    }
  }
  return createWindow(path)
}

function suggestedPath(
  win: BrowserWindow | null,
  suggestedName: string | undefined,
  ext: string
): string {
  const current = win ? stateOf(win).filePath : null
  const dir = current ? dirname(current) : app.getPath('documents')
  const base = suggestedName ?? (current ? basename(current).replace(/\.[^.]+$/, '') : 'documento')
  return join(dir, `${base}.${ext}`)
}

export function registerIpc(): void {
  ipcMain.handle(IPC.getInitialFile, async (e): Promise<OpenedFile | null> => {
    const win = senderWindow(e)
    const path = win ? stateOf(win).initialPath : null
    if (!path) return null
    try {
      return await readMarkdown(path)
    } catch (err) {
      dialog.showErrorBox('No se pudo abrir el archivo', String(err))
      if (win) setWindowPath(win, null)
      return null
    }
  })

  ipcMain.handle(IPC.openFileDialog, async (e) => {
    await openFileDialog(senderWindow(e) ?? undefined)
  })

  ipcMain.handle(IPC.readFile, (_e, path: string) => readMarkdown(path))

  ipcMain.handle(IPC.openPath, (e, path: string) => {
    openPathInWindow(path, senderWindow(e))
  })

  ipcMain.handle(IPC.saveFile, async (e, path: string, content: string): Promise<SaveResult> => {
    try {
      await writeFile(path, content, 'utf8')
      const win = senderWindow(e)
      if (win) {
        setWindowPath(win, path)
        setWindowDirty(win, false)
      }
      return { ok: true, path }
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  })

  ipcMain.handle(
    IPC.saveFileAs,
    async (e, content: string, suggestedName?: string): Promise<SaveResult> => {
      const win = senderWindow(e)
      const result = await dialog.showSaveDialog(win ?? undefined!, {
        defaultPath: suggestedPath(win, suggestedName, 'md'),
        filters: MD_FILTERS
      })
      if (result.canceled || !result.filePath) return { ok: false }
      try {
        await writeFile(result.filePath, content, 'utf8')
        if (win) {
          setWindowPath(win, result.filePath)
          setWindowDirty(win, false)
        }
        addRecent(result.filePath)
        rebuildMenu()
        return { ok: true, path: result.filePath }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    IPC.exportHtml,
    async (e, html: string, suggestedName?: string): Promise<ExportResult> => {
      const win = senderWindow(e)
      const result = await dialog.showSaveDialog(win ?? undefined!, {
        defaultPath: suggestedPath(win, suggestedName, 'html'),
        filters: [{ name: 'HTML', extensions: ['html'] }]
      })
      if (result.canceled || !result.filePath) return { ok: false }
      try {
        await writeHtml(result.filePath, html)
        return { ok: true, path: result.filePath }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    IPC.exportPdf,
    async (e, html: string, suggestedName?: string): Promise<ExportResult> => {
      const win = senderWindow(e)
      const result = await dialog.showSaveDialog(win ?? undefined!, {
        defaultPath: suggestedPath(win, suggestedName, 'pdf'),
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
      if (result.canceled || !result.filePath) return { ok: false }
      try {
        await writePdf(result.filePath, html)
        return { ok: true, path: result.filePath }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(
    IPC.saveAsset,
    async (
      _e,
      docPath: string,
      name: string | null,
      mime: string,
      data: ArrayBuffer
    ): Promise<AssetResult> => {
      try {
        const dir = join(dirname(docPath), ASSETS_DIR)
        await mkdir(dir, { recursive: true })
        const fileName = uniqueAssetName(name, mime, (c) => existsSync(join(dir, c)))
        await writeFile(join(dir, fileName), Buffer.from(data))
        return { ok: true, relPath: `${ASSETS_DIR}/${fileName}` }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    }
  )

  ipcMain.handle(IPC.getPreferences, (): Preferences => getPreferences())
  ipcMain.handle(IPC.setPreferences, (_e, patch: Partial<Preferences>): Preferences => {
    const prefs = setPreferences(patch)
    rebuildMenu()
    return prefs
  })

  ipcMain.on(IPC.setDirty, (e, dirty: boolean) => {
    const win = senderWindow(e)
    if (win) setWindowDirty(win, dirty)
  })
  ipcMain.on(IPC.setCurrentPath, (e, path: string | null) => {
    const win = senderWindow(e)
    if (win) setWindowPath(win, path)
  })
}
