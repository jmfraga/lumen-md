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
  // \\servidor\carpeta (red de Windows) conserva sus dos barras iniciales.
  const prefix = /^[\\/]{2}/.test(baseDir) ? sep + sep : baseDir.startsWith('/') ? '/' : ''
  return prefix + out.join(sep)
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s // un "%" suelto: se usa tal cual
  }
}

export function resolveAssetUrl(url: string, baseDir: string | null): string {
  if (!url || isRemote(url)) return url
  // En Markdown los espacios suelen venir como %20: decodificar antes de volver
  // a codificar, o "mi%20foto.png" acaba buscando un archivo que no existe.
  const plain = safeDecode(url.startsWith('file://') ? url.slice('file://'.length) : url)
  let abs = plain
  if (!url.startsWith('file://') && !/^([a-zA-Z]:[\\/]|\/)/.test(plain)) {
    if (!baseDir) return url
    abs = joinPath(baseDir, plain)
  }
  // Windows: C:\a\b → C:/a/b (y file:///C:/… → C:/…). Main lo deshace con assetPathFromUrl (shared/assets).
  abs = abs.replace(/\\/g, '/').replace(/^\/([a-zA-Z]:\/)/, '$1')
  const sep = abs.startsWith('/') ? '' : '/'
  return `${ASSET_SCHEME}://file${sep}${encodeURIComponent(abs).replace(/%2F/g, '/')}`
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
