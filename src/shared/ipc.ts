/** Contrato IPC entre main y renderer. Único punto de acuerdo entre ambos lados. */

import type { UpdateState, FeedbackKind } from './update'

export interface OpenedFile {
  path: string
  content: string
}

export interface SaveResult {
  ok: boolean
  path?: string
  error?: string
}

export interface ExportResult {
  ok: boolean
  path?: string
  error?: string
}

export interface AssetResult {
  ok: boolean
  /** Ruta relativa al documento, lista para el Markdown (p. ej. `assets/foto.png`). */
  relPath?: string
  error?: string
}

export interface Preferences {
  autosave: boolean
  /** Revisar actualizaciones al abrir y una vez al día. */
  checkUpdates: boolean
}

/** API expuesta al renderer vía contextBridge como `window.lumen`. */
export interface LumenApi {
  /** Archivo con el que se abrió esta ventana (null = documento nuevo). */
  getInitialFile(): Promise<OpenedFile | null>
  /** Diálogo de abrir: abre en una ventana nueva. */
  openFileDialog(): Promise<void>
  readFile(path: string): Promise<OpenedFile>
  /** Abre una ruta: reutiliza la ventana actual si está vacía y limpia, si no crea otra. */
  openPath(path: string): Promise<void>
  saveFile(path: string, content: string): Promise<SaveResult>
  saveFileAs(content: string, suggestedName?: string): Promise<SaveResult>
  exportHtml(html: string, suggestedName?: string): Promise<ExportResult>
  exportPdf(html: string, suggestedName?: string): Promise<ExportResult>
  /** Copia una imagen a `assets/` junto al documento y devuelve la ruta relativa. */
  saveAsset(
    docPath: string,
    name: string | null,
    mime: string,
    data: ArrayBuffer
  ): Promise<AssetResult>
  getPreferences(): Promise<Preferences>
  setPreferences(prefs: Partial<Preferences>): Promise<Preferences>
  /** El renderer avisa si tiene cambios sin guardar (para el aviso al cerrar). */
  setDirty(dirty: boolean): void
  /** El renderer avisa la ruta actual (título de ventana, recientes). */
  setCurrentPath(path: string | null): void
  /** Comandos que llegan desde el menú nativo. */
  onCommand(handler: (command: MenuCommand) => void): () => void
  /** Archivo soltado sobre la ventana (ruta resuelta por preload). */
  pathForFile(file: File): string
  /** Actualizaciones. */
  getUpdateState(): Promise<UpdateState>
  checkForUpdates(): Promise<void>
  downloadUpdate(): Promise<void>
  installUpdate(): Promise<{ ok: boolean; reason?: 'dirty' | 'not-ready' }>
  openReleasePage(url?: string): void
  /** Abre GitHub con la plantilla de mejora o problema, con versión y sistema ya llenos. */
  openFeedback(kind: FeedbackKind): void
  onUpdateState(handler: (state: UpdateState) => void): () => void
  /** Main pide a una ventana vacía que cargue esta ruta. */
  onOpenPath(handler: (path: string) => void): () => void
}

export type MenuCommand =
  | 'save'
  | 'save-as'
  | 'export-html'
  | 'export-pdf'
  | 'toggle-source'
  | 'toggle-autosave'
  | 'request-close'

export const IPC = {
  getInitialFile: 'lumen:get-initial-file',
  openFileDialog: 'lumen:open-file-dialog',
  readFile: 'lumen:read-file',
  openPath: 'lumen:open-path-request',
  saveFile: 'lumen:save-file',
  saveFileAs: 'lumen:save-file-as',
  exportHtml: 'lumen:export-html',
  exportPdf: 'lumen:export-pdf',
  saveAsset: 'lumen:save-asset',
  getPreferences: 'lumen:get-preferences',
  setPreferences: 'lumen:set-preferences',
  setDirty: 'lumen:set-dirty',
  setCurrentPath: 'lumen:set-current-path',
  command: 'lumen:command',
  updateState: 'lumen:update-state',
  getUpdateState: 'lumen:get-update-state',
  checkForUpdates: 'lumen:check-updates',
  downloadUpdate: 'lumen:download-update',
  installUpdate: 'lumen:install-update',
  openReleasePage: 'lumen:open-release-page',
  openFeedback: 'lumen:open-feedback',
  openPathEvent: 'lumen:open-path'
} as const
