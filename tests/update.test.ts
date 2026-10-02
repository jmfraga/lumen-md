import { describe, it, expect } from 'vitest'
import { compareVersions, isNewer, parseVersion, releaseNotesUrl } from '../src/shared/update'

describe('comparación de versiones', () => {
  it('reconoce el prefijo v y prerelease', () => {
    expect(parseVersion('v0.3.0')).toEqual({ parts: [0, 3, 0], pre: '' })
    expect(parseVersion('1.2.3-beta.1')).toEqual({ parts: [1, 2, 3], pre: 'beta.1' })
    expect(parseVersion('no-es-version')).toBeNull()
  })
  it('ordena por mayor, menor y parche numéricamente', () => {
    expect(isNewer('0.3.0', '0.2.1')).toBe(true)
    expect(isNewer('0.2.10', '0.2.9')).toBe(true) // no lexicográfico
    expect(isNewer('1.0.0', '0.99.99')).toBe(true)
    expect(isNewer('0.2.1', '0.2.1')).toBe(false)
    expect(isNewer('0.2.0', '0.2.1')).toBe(false)
  })
  it('una release gana a su prerelease', () => {
    expect(compareVersions('0.3.0', '0.3.0-beta.1')).toBeGreaterThan(0)
    expect(compareVersions('0.3.0-beta.1', '0.3.0')).toBeLessThan(0)
  })
  it('versiones ilegibles nunca disparan una actualización', () => {
    expect(isNewer('basura', '0.1.0')).toBe(false)
  })
  it('enlace de novedades por versión', () => {
    expect(releaseNotesUrl('0.3.0')).toBe('https://github.com/jmfraga/lumen-md/releases/tag/v0.3.0')
  })
})

import { feedbackUrl, systemLabel } from '../src/shared/update'

describe('propuestas por GitHub Issues', () => {
  it('abre la plantilla con versión y sistema prellenados', () => {
    const url = new URL(feedbackUrl('mejora', '0.3.0', 'Mac (25.5.0)'))
    expect(url.origin + url.pathname).toBe('https://github.com/jmfraga/lumen-md/issues/new')
    expect(url.searchParams.get('template')).toBe('mejora.yml')
    expect(url.searchParams.get('version')).toBe('0.3.0')
    expect(url.searchParams.get('sistema')).toBe('Mac (25.5.0)')
  })
  it('nombres de sistema legibles', () => {
    expect(systemLabel('win32', '10.0.22631')).toBe('Windows (10.0.22631)')
    expect(systemLabel('darwin', '25.5.0')).toBe('Mac (25.5.0)')
  })
})
