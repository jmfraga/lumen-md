import { describe, expect, it } from 'vitest'
import { unescapePlainBrackets } from '../src/renderer/src/editor/serialization'
import { roundTrip } from './helpers/roundtrip'
import './helpers/jsdom-layout'

describe('dinero no es fórmula', () => {
  it('pesos sin escapar se leen como texto y se guardan escapados', async () => {
    const out = await roundTrip(
      'Plan anual (MX$2,025 sin IVA), mercado de unos MX$17,900 millones (TAM).\n'
    )
    expect(out.trim()).toBe(
      'Plan anual (MX\\$2,025 sin IVA), mercado de unos MX\\$17,900 millones (TAM).'
    )
  })

  it('contenido con espacio en el borde no es fórmula', async () => {
    expect((await roundTrip('De $ 5 a $ 10.\n')).trim()).toBe('De \\$ 5 a \\$ 10.')
  })

  it('una fórmula real sigue siendo fórmula', async () => {
    expect((await roundTrip('Sea $x^2$ y nada más.\n')).trim()).toBe('Sea $x^2$ y nada más.')
  })
})

describe('corchetes sin enlace', () => {
  it('quita el escape solo cuando no puede formar enlace', () => {
    expect(unescapePlainBrackets('\\[JMF: dato] y más', false)).toBe('[JMF: dato] y más')
    expect(unescapePlainBrackets('\\[a](b)', false)).toBe('\\[a](b)')
    expect(unescapePlainBrackets('\\[a]: def', false)).toBe('\\[a]: def')
    expect(unescapePlainBrackets('\\[a][b]', false)).toBe('\\[a][b]')
    expect(unescapePlainBrackets('\\[ ] no es tarea', false)).toBe('\\[ ] no es tarea')
    expect(unescapePlainBrackets('ver \\[a]', true)).toBe('ver \\[a]')
    expect(unescapePlainBrackets('\\[\\[wiki]]', false)).toBe('\\[\\[wiki]]')
  })
})
