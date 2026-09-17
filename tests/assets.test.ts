import { describe, it, expect } from 'vitest'
import { uniqueAssetName, sanitizeBaseName, extensionFor } from '../src/shared/assets'

describe('nombres de imágenes en assets/', () => {
  it('limpia acentos, espacios y rutas', () => {
    expect(sanitizeBaseName('Foto de Ángel (1).PNG')).toBe('foto-de-angel-1')
    expect(sanitizeBaseName('../../etc/passwd')).toBe('etc-passwd')
    expect(sanitizeBaseName('.png')).toBe('imagen')
  })
  it('extensión del nombre o del mime', () => {
    expect(extensionFor('a.JPEG', 'image/png')).toBe('jpeg')
    expect(extensionFor('', 'image/webp')).toBe('webp')
    expect(extensionFor('', 'application/octet-stream')).toBe('png')
  })
  it('evita colisiones con sufijo numérico', () => {
    const existing = new Set(['foto.png', 'foto-2.png'])
    expect(uniqueAssetName('foto.png', 'image/png', (c) => existing.has(c))).toBe('foto-3.png')
    expect(uniqueAssetName('nueva.png', 'image/png', (c) => existing.has(c))).toBe('nueva.png')
  })
  it('pegados sin nombre usan fecha y hora', () => {
    const d = new Date(2026, 8, 17, 9, 5, 7)
    expect(uniqueAssetName(null, 'image/png', () => false, d)).toBe('pegado-20260917-090507.png')
  })
})
