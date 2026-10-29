import { createContext, useContext } from 'react'
import { translator, type Lang, type Translator } from '../../shared/i18n'

/** Idioma activo para toda la interfaz. App lo provee; cada componente lo lee con useI18n(). */
export interface I18n {
  lang: Lang
  t: Translator
  /** Plataforma, para mostrar atajos con ⌘ o Ctrl. */
  platform: string
}

const defaultLang: Lang = 'es'

export const I18nContext = createContext<I18n>({
  lang: defaultLang,
  t: translator(defaultLang),
  platform: 'darwin'
})

export function useI18n(): I18n {
  return useContext(I18nContext)
}
