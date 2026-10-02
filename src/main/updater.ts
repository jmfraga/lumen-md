import { app, BrowserWindow, net, shell } from 'electron'
import { release } from 'os'
import { autoUpdater } from 'electron-updater'
import {
  CHECK_INTERVAL_MS,
  FIRST_CHECK_DELAY_MS,
  LATEST_API,
  LATEST_URL,
  RELEASES_URL,
  feedbackUrl,
  isNewer,
  systemLabel,
  type FeedbackKind,
  releaseNotesUrl,
  type UpdateState
} from '../shared/update'
import { IPC } from '../shared/ipc'
import { getPreferences } from './store'
import { stateOf } from './windows'

/**
 * Actualizaciones desde GitHub Releases.
 *
 * - Con soporte (Mac firmado, Windows NSIS, Linux AppImage): electron-updater
 *   avisa, descarga cuando el usuario lo pide e instala al reiniciar.
 * - Sin soporte (Linux .deb, desarrollo): se consulta la API de GitHub y solo se
 *   avisa con enlace a la página de descargas.
 *
 * Nunca descarga ni instala sin que el usuario lo pida. Nunca bloquea la app.
 */

let state: UpdateState = { status: 'idle' }
let manualCheck = false
let timer: ReturnType<typeof setInterval> | null = null

const log = (...args: unknown[]): void => console.log('[lumen:update]', ...args)

/** Versión actual. En desarrollo, LUMEN_UPDATE_CURRENT_VERSION finge una versión vieja para probar el aviso. */
function currentVersion(): string {
  const fake = process.env['LUMEN_UPDATE_CURRENT_VERSION']
  return !app.isPackaged && fake ? fake : app.getVersion()
}

/** El AppImage define APPIMAGE; un .deb instalado no. */
export function canAutoUpdate(): boolean {
  if (!app.isPackaged) return false
  if (process.platform === 'linux') return Boolean(process.env['APPIMAGE'])
  return true
}

function broadcast(next: UpdateState): void {
  state = next
  log(next.status, 'version' in next ? next.version : '', 'message' in next ? next.message : '')
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(IPC.updateState, state)
  }
}

export function getUpdateState(): UpdateState {
  return state
}

/** Plan B sin electron-updater: compara contra la última versión publicada en GitHub. */
async function checkViaGithubApi(manual: boolean): Promise<void> {
  try {
    const res = await net.fetch(LATEST_API, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': `Lumen/${currentVersion()}` }
    })
    if (!res.ok) throw new Error(`GitHub respondió ${res.status}`)
    const data = (await res.json()) as { tag_name?: string; html_url?: string }
    const latest = (data.tag_name ?? '').replace(/^v/, '')
    if (latest && isNewer(latest, currentVersion())) {
      broadcast({
        status: 'available',
        version: latest,
        notesUrl: data.html_url ?? releaseNotesUrl(latest),
        canAutoUpdate: false
      })
    } else {
      broadcast({ status: 'up-to-date', version: currentVersion(), manual })
    }
  } catch (err) {
    broadcast({ status: 'error', message: friendlyError(err), manual })
  }
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/ENOTFOUND|ENETUNREACH|ERR_INTERNET_DISCONNECTED|ERR_NAME_NOT_RESOLVED|offline/i.test(msg)) {
    return 'Sin conexión a internet. Se volverá a intentar más tarde.'
  }
  if (/read-only|EROFS|not in \/Applications|ApplicationsFolder/i.test(msg)) {
    return 'Mueve Lumen a la carpeta Aplicaciones para poder actualizarla.'
  }
  return 'No se pudo revisar o descargar la actualización.'
}

export async function checkForUpdates(manual: boolean): Promise<void> {
  if (state.status === 'checking' || state.status === 'downloading') return
  if (state.status === 'ready') {
    broadcast(state) // ya está lista; solo recordarlo
    return
  }
  manualCheck = manual
  broadcast({ status: 'checking', manual })
  if (!canAutoUpdate()) return checkViaGithubApi(manual)
  try {
    await autoUpdater.checkForUpdates()
  } catch (err) {
    log('electron-updater falló, uso la API de GitHub', err)
    await checkViaGithubApi(manual)
  }
}

export async function downloadUpdate(): Promise<void> {
  if (state.status !== 'available' || !state.canAutoUpdate) {
    await shell.openExternal(LATEST_URL)
    return
  }
  const version = state.version
  broadcast({ status: 'downloading', version, percent: 0 })
  try {
    await autoUpdater.downloadUpdate()
  } catch (err) {
    broadcast({ status: 'error', message: friendlyError(err), manual: true })
  }
}

/** Instala y reinicia. Rechaza si hay documentos sin guardar (el renderer ya intentó guardar). */
export function installUpdate(): { ok: boolean; reason?: 'dirty' | 'not-ready' } {
  if (state.status !== 'ready') return { ok: false, reason: 'not-ready' }
  const dirty = BrowserWindow.getAllWindows().some((w) => !w.isDestroyed() && stateOf(w).dirty)
  if (dirty) return { ok: false, reason: 'dirty' }
  // Windows: instalador visible (isSilent=false) y reabrir al terminar.
  setImmediate(() => autoUpdater.quitAndInstall(false, true))
  return { ok: true }
}

export function openReleasePage(url?: string): void {
  // Solo páginas de este proyecto: nada que venga del renderer abre URLs arbitrarias.
  const target = url && url.startsWith(RELEASES_URL) ? url : LATEST_URL
  void shell.openExternal(target)
}

export function openFeedback(kind: FeedbackKind): void {
  const k: FeedbackKind = kind === 'problema' ? 'problema' : 'mejora'
  void shell.openExternal(
    feedbackUrl(k, app.getVersion(), systemLabel(process.platform, release()))
  )
}

export function initUpdater(): void {
  autoUpdater.autoDownload = false
  // "Más tarde" sobre una descarga lista: se instala al cerrar Lumen.
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false
  autoUpdater.logger = { info: log, warn: log, error: log, debug: () => undefined }

  autoUpdater.on('update-available', (info) => {
    broadcast({
      status: 'available',
      version: info.version,
      notesUrl: releaseNotesUrl(info.version),
      canAutoUpdate: true
    })
  })
  autoUpdater.on('update-not-available', () => {
    broadcast({ status: 'up-to-date', version: app.getVersion(), manual: manualCheck })
  })
  autoUpdater.on('download-progress', (p) => {
    if (state.status !== 'downloading') return
    broadcast({ status: 'downloading', version: state.version, percent: Math.round(p.percent) })
  })
  autoUpdater.on('update-downloaded', (info) => {
    broadcast({ status: 'ready', version: info.version })
  })
  autoUpdater.on('error', (err) => {
    // Durante una revisión automática no molestamos: se reintenta en 24 h.
    if (state.status === 'checking' && !manualCheck) {
      broadcast({ status: 'idle' })
      return
    }
    broadcast({ status: 'error', message: friendlyError(err), manual: manualCheck })
  })

  const auto = (): void => {
    if (getPreferences().checkUpdates) void checkForUpdates(false)
  }
  setTimeout(auto, Number(process.env['LUMEN_UPDATE_DELAY'] ?? FIRST_CHECK_DELAY_MS))
  timer = setInterval(auto, CHECK_INTERVAL_MS)
  app.on('before-quit', () => {
    if (timer) clearInterval(timer)
  })
}
