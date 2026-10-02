/** Estado del actualizador, compartido entre main y renderer. Puro, probable en Node. */

export const RELEASES_URL = 'https://github.com/jmfraga/lumen-md/releases'
export const LATEST_URL = `${RELEASES_URL}/latest`
export const LATEST_API = 'https://api.github.com/repos/jmfraga/lumen-md/releases/latest'

export function releaseNotesUrl(version: string): string {
  return `${RELEASES_URL}/tag/v${version}`
}

export type UpdateState =
  | { status: 'idle' }
  | { status: 'checking'; manual: boolean }
  | { status: 'up-to-date'; version: string; manual: boolean }
  /** canAutoUpdate=false: solo se puede abrir la página de descargas (Linux .deb, desarrollo). */
  | { status: 'available'; version: string; notesUrl: string; canAutoUpdate: boolean }
  | { status: 'downloading'; version: string; percent: number }
  | { status: 'ready'; version: string }
  | { status: 'error'; message: string; manual: boolean }

/** Semver mínimo: MAYOR.MENOR.PARCHE con prefijo `v` opcional; prerelease < release. */
export function parseVersion(v: string): { parts: [number, number, number]; pre: string } | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/.exec(v.trim())
  if (!m) return null
  return { parts: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? '' }
}

/** >0 si a es más nueva que b, <0 si es más vieja, 0 si iguales o no comparables. */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (!pa || !pb) return 0
  for (let i = 0; i < 3; i++) {
    const d = pa.parts[i] - pb.parts[i]
    if (d !== 0) return d
  }
  if (pa.pre === pb.pre) return 0
  if (!pa.pre) return 1
  if (!pb.pre) return -1
  return pa.pre < pb.pre ? -1 : 1
}

export function isNewer(candidate: string, current: string): boolean {
  return compareVersions(candidate, current) > 0
}

/** Cada cuánto se revisa con la app abierta. */
export const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000
/** Retardo de la primera revisión tras abrir, para no competir con la carga del documento. */
export const FIRST_CHECK_DELAY_MS = 8_000

/* ---- Propuestas y reportes (GitHub Issues) ---- */

export type FeedbackKind = 'mejora' | 'problema'

const ISSUES_NEW = 'https://github.com/jmfraga/lumen-md/issues/new'

/**
 * Enlace a un issue nuevo con la plantilla y los campos de versión y sistema
 * ya llenos (GitHub rellena campos de issue forms por su `id` en la URL).
 */
export function feedbackUrl(kind: FeedbackKind, version: string, system: string): string {
  const params = new URLSearchParams({
    template: `${kind}.yml`,
    version,
    sistema: system
  })
  return `${ISSUES_NEW}?${params.toString()}`
}

export function systemLabel(platform: string, release: string): string {
  const name =
    platform === 'darwin'
      ? 'Mac'
      : platform === 'win32'
        ? 'Windows'
        : platform === 'linux'
          ? 'Linux'
          : platform
  return `${name} (${release})`
}
