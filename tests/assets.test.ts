import { resolveAssetUrl } from '../src/renderer/src/export/assets'
import { describe, it, expect } from 'vitest'
import {
  uniqueAssetName,
  sanitizeBaseName,
  extensionFor,
  assetPathFromUrl
} from '../src/shared/assets'

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

describe('rutas de imágenes lumen:// (ida y vuelta)', () => {
  const roundTrip = (url: string, baseDir: string | null): string | null =>
    assetPathFromUrl(resolveAssetUrl(url, baseDir))

  it('Windows: relativa contra C:\\', () => {
    expect(roundTrip('assets/foto.png', 'C:\\Users\\Ana\\Docs')).toBe(
      'C:/Users/Ana/Docs/assets/foto.png'
    )
  })
  it('Windows: espacios y acentos', () => {
    expect(roundTrip('assets/mi foto.png', 'C:\\Users\\Ana María\\Mis docs')).toBe(
      'C:/Users/Ana María/Mis docs/assets/mi foto.png'
    )
  })
  it('Windows: absoluta y file:///', () => {
    expect(roundTrip('D:\\fotos\\a.png', null)).toBe('D:/fotos/a.png')
    expect(roundTrip('file:///C:/fotos/a.png', null)).toBe('C:/fotos/a.png')
  })
  it('Mac/Linux: relativa, absoluta y con ..', () => {
    expect(roundTrip('assets/a.png', '/Users/ana/docs')).toBe('/Users/ana/docs/assets/a.png')
    expect(roundTrip('/tmp/a b.png', null)).toBe('/tmp/a b.png')
    expect(roundTrip('../img/a.png', '/Users/ana/docs')).toBe('/Users/ana/img/a.png')
  })
  it('otro host no es un archivo', () => {
    expect(assetPathFromUrl('lumen://otro/x')).toBeNull()
  })
})

it('Windows: carpeta de red (UNC) se conserva', () => {
  expect(assetPathFromUrl(resolveAssetUrl('a.png', '\\\\servidor\\docs'))).toBe(
    '//servidor/docs/a.png'
  )
})

it('espacios escritos como %20 en el Markdown', () => {
  expect(assetPathFromUrl(resolveAssetUrl('assets/mi%20foto.png', '/Users/ana/docs'))).toBe(
    '/Users/ana/docs/assets/mi foto.png'
  )
  expect(assetPathFromUrl(resolveAssetUrl('assets/100%.png', '/d'))).toBe('/d/assets/100%.png')
})
