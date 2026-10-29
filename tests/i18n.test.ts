import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { DICTIONARIES, LANGS, detectLang, shortcut, t, type MessageKey } from '../src/shared/i18n'

const keys = Object.keys(DICTIONARIES.es) as MessageKey[]
const vars = (s: string): string[] => (s.match(/\{(\w+)\}/g) ?? []).sort()

describe('diccionarios', () => {
  it('los dos idiomas tienen exactamente las mismas claves', () => {
    expect(Object.keys(DICTIONARIES.en).sort()).toEqual([...keys].sort())
  })

  it('ninguna frase está vacía', () => {
    for (const lang of LANGS)
      for (const k of keys) expect(DICTIONARIES[lang][k].trim(), `${lang}:${k}`).not.toBe('')
  })

  it('las variables {x} coinciden entre idiomas', () => {
    for (const k of keys) expect(vars(DICTIONARIES.en[k]), k).toEqual(vars(DICTIONARIES.es[k]))
  })

  it('el inglés no trae acentos ni signos de apertura del español', () => {
    for (const k of keys) expect(DICTIONARIES.en[k], k).not.toMatch(/[áéíóúñÁÉÍÓÚÑ¿¡]/)
  })

  it('el inglés es americano y consistente', () => {
    const british =
      /\b(colour|favour|behaviour|organis|recognis|customis|analys|centre|licence|cancelled)\w*/i
    for (const k of keys) expect(DICTIONARIES.en[k], k).not.toMatch(british)
  })
})

describe('traducción', () => {
  it('interpola variables y deja intactas las desconocidas', () => {
    expect(t('es', 'status.words', { n: 3 })).toBe('3 palabras')
    expect(t('en', 'status.words', { n: 3 })).toBe('3 words')
    expect(t('en', 'msg.exported', {})).toBe('Exported: {path}')
  })

  it('detecta el idioma del sistema', () => {
    expect(detectLang('es-MX')).toBe('es')
    expect(detectLang('es')).toBe('es')
    expect(detectLang('es_ES')).toBe('es')
    expect(detectLang('en-US')).toBe('en')
    expect(detectLang('fr-FR')).toBe('en')
    expect(detectLang('')).toBe('en')
    expect(detectLang(undefined)).toBe('en')
    expect(detectLang('estonian')).toBe('en')
  })

  it('atajos con ⌘ en Mac y Ctrl en Windows/Linux', () => {
    expect(shortcut('darwin', 'S')).toBe('⌘S')
    expect(shortcut('win32', 'S')).toBe('Ctrl+S')
    expect(shortcut('linux', '/')).toBe('Ctrl+/')
  })
})

/**
 * Guardián: ninguna frase en español escrita a mano en la interfaz. Todo texto visible
 * debe pasar por los diccionarios. Detecta cadenas y texto JSX con acentos o ¿¡.
 */
describe('sin textos sueltos fuera de los diccionarios', () => {
  const root = join(__dirname, '..', 'src')
  const files = [
    ...readdirSync(join(root, 'renderer/src/ui')).map((f) => `renderer/src/ui/${f}`),
    'renderer/src/App.tsx',
    'renderer/src/editor/WysiwygEditor.tsx',
    'renderer/src/editor/insert.ts',
    'renderer/src/editor/mermaid-builder.ts',
    'renderer/src/editor/image-upload.ts',
    'renderer/src/state/document.ts',
    'main/menu.ts',
    'main/windows.ts',
    'main/ipc.ts',
    'main/updater.ts'
  ]
  const spanish = /[áéíóúñÁÉÍÓÚÑ¿¡]/

  for (const f of files) {
    it(f, () => {
      const offenders: string[] = []
      readFileSync(join(root, f), 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const code = line.trim()
          if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) return
          const noComment = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
          // Cadenas '…', "…", `…` y texto JSX >…<
          const pieces = noComment.match(/'[^']*'|"[^"]*"|`[^`]*`|>[^<>{}]+</g) ?? []
          if (pieces.some((p) => spanish.test(p))) offenders.push(`${i + 1}: ${code}`)
          // Texto JSX en su propia línea (sin comillas ni etiquetas)
          else if (/\.tsx$/.test(f) && spanish.test(code) && !/[=(){};]/.test(code))
            offenders.push(`${i + 1}: ${code}`)
        })
      expect(offenders).toEqual([])
    })
  }
})
