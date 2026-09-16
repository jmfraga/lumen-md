/**
 * Resolución de imágenes relativas. El renderer no puede cargar file:// desde
 * http (dev) y en producción tampoco queremos que un .md apunte a cualquier
 * ruta del disco sin pasar por nuestro protocolo. `lumen://file/<ruta>` lo
 * sirve main con protocol.handle.
 */

export const ASSET_SCHEME = 'lumen'

export function isRemote(url: string): boolean {
  return /^(https?:|data:|blob:|lumen:)/i.test(url)
}

function joinPath(baseDir: string, rel: string): string {
  const sep = baseDir.includes('\\') && !baseDir.includes('/') ? '\\' : '/'
  const parts = [...baseDir.split(/[\\/]/), ...rel.split(/[\\/]/)]
  const out: string[] = []
  for (const p of parts) {
    if (p === '' || p === '.') continue
    if (p === '..') out.pop()
    else out.push(p)
  }
  const prefix = baseDir.startsWith('/') ? '/' : ''
  return prefix + out.join(sep)
}

export function resolveAssetUrl(url: string, baseDir: string | null): string {
  if (!url || isRemote(url)) return url
  let abs = url
  if (url.startsWith('file://')) abs = decodeURIComponent(url.slice('file://'.length))
  else if (!/^([a-zA-Z]:[\\/]|\/)/.test(url)) {
    if (!baseDir) return url
    abs = joinPath(baseDir, url)
  }
  return `${ASSET_SCHEME}://file/${encodeURIComponent(abs).replace(/%2F/g, '/')}`
}

/** Convierte una URL (lumen:// o http) en data: URI para el HTML autocontenido. */
export async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
