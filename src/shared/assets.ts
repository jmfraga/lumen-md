/** Nombres de archivo para imágenes copiadas a `assets/` junto al documento. Puro, probable en Node. */

export const ASSETS_DIR = 'assets'

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/avif': 'avif'
}

export function extensionFor(name: string, mime: string): string {
  const m = /\.([a-z0-9]{2,5})$/i.exec(name)
  if (m) return m[1].toLowerCase()
  return EXT_BY_MIME[mime] ?? 'png'
}

/** Nombre seguro y legible: sin rutas, sin caracteres raros, sin espacios. */
export function sanitizeBaseName(name: string): string {
  const base = name
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase()
  return base || 'imagen'
}

function stamp(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

/**
 * Nombre único dentro de la carpeta: `base.ext`, y si existe `base-2.ext`, `base-3.ext`…
 * Para pegados (sin nombre) se usa `pegado-AAAAMMDD-HHMMSS.ext`.
 */
export function uniqueAssetName(
  originalName: string | null,
  mime: string,
  exists: (candidate: string) => boolean,
  now: Date = new Date()
): string {
  const ext = extensionFor(originalName ?? '', mime)
  const base = originalName ? sanitizeBaseName(originalName) : `pegado-${stamp(now)}`
  let candidate = `${base}.${ext}`
  let i = 2
  while (exists(candidate)) candidate = `${base}-${i++}.${ext}`
  return candidate
}
