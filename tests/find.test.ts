import { describe, expect, it } from 'vitest'
import { findInText, foldText } from '../src/renderer/src/editor/find'

describe('buscar en el documento', () => {
  it('pliega mayúsculas y acentos sin cambiar la longitud', () => {
    const s = 'Búsqueda ÁRBOL niño Ü ß'
    expect(foldText(s)).toBe('busqueda arbol nino u ß')
    expect(foldText(s)).toHaveLength(s.length)
  })

  it('encuentra sin importar acentos ni mayúsculas, en ambos sentidos', () => {
    expect(findInText('La Búsqueda y la busqueda', 'busqueda')).toEqual([
      [3, 11],
      [17, 25]
    ])
    expect(findInText('la busqueda', 'BÚSQUEDA')).toEqual([[3, 11]])
  })

  it('no traslapa coincidencias y una búsqueda vacía no encuentra nada', () => {
    expect(findInText('aaaa', 'aa')).toEqual([
      [0, 2],
      [2, 4]
    ])
    expect(findInText('texto', '')).toEqual([])
  })

  it('los índices sirven sobre el texto original', () => {
    const text = 'Él dijo: CAFÉ, café y cafe.'
    const hits = findInText(text, 'café').map(([a, b]) => text.slice(a, b))
    expect(hits).toEqual(['CAFÉ', 'café', 'cafe'])
  })
})
