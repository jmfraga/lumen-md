import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { IPC } from '../shared/ipc'
import type { LumenApi, MenuCommand, Preferences } from '../shared/ipc'

const lumen: LumenApi = {
  getInitialFile: () => ipcRenderer.invoke(IPC.getInitialFile),
  openFileDialog: () => ipcRenderer.invoke(IPC.openFileDialog),
  readFile: (path) => ipcRenderer.invoke(IPC.readFile, path),
  openPath: (path) => ipcRenderer.invoke(IPC.openPath, path),
  saveFile: (path, content) => ipcRenderer.invoke(IPC.saveFile, path, content),
  saveFileAs: (content, suggestedName) =>
    ipcRenderer.invoke(IPC.saveFileAs, content, suggestedName),
  exportHtml: (html, suggestedName) => ipcRenderer.invoke(IPC.exportHtml, html, suggestedName),
  exportPdf: (html, suggestedName) => ipcRenderer.invoke(IPC.exportPdf, html, suggestedName),
  getPreferences: () => ipcRenderer.invoke(IPC.getPreferences),
  setPreferences: (prefs: Partial<Preferences>) => ipcRenderer.invoke(IPC.setPreferences, prefs),
  setDirty: (dirty) => ipcRenderer.send(IPC.setDirty, dirty),
  setCurrentPath: (path) => ipcRenderer.send(IPC.setCurrentPath, path),
  onCommand: (handler) => {
    const listener = (_e: Electron.IpcRendererEvent, command: MenuCommand): void => handler(command)
    ipcRenderer.on(IPC.command, listener)
    return () => ipcRenderer.removeListener(IPC.command, listener)
  },
  pathForFile: (file) => webUtils.getPathForFile(file),
  onOpenPath: (handler) => {
    const listener = (_e: Electron.IpcRendererEvent, path: string): void => handler(path)
    ipcRenderer.on(IPC.openPathEvent, listener)
    return () => ipcRenderer.removeListener(IPC.openPathEvent, listener)
  }
}

contextBridge.exposeInMainWorld('lumen', lumen)
