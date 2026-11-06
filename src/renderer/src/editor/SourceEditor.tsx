import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  drawSelection
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { search, openSearchPanel, findNext, findPrevious } from '@codemirror/search'
import { translator, type Lang } from '../../../shared/i18n'
import { isDark } from './mermaid'

interface Props {
  initialText: string
  onChange: (text: string) => void
  /** Idioma del panel de búsqueda. Cambiarlo remonta el editor (la key del componente lo fuerza). */
  lang: Lang
}

export interface SourceHandle {
  /** Abre el panel de búsqueda de CodeMirror (incluye reemplazar). */
  find: () => void
  step: (dir: 1 | -1) => void
}

/** Vista de fuente cruda con CodeMirror 6. Escape de fidelidad del WYSIWYG. */
export const SourceEditor = forwardRef<SourceHandle, Props>(function SourceEditor(
  { initialText, onChange, lang },
  ref
): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  useImperativeHandle(ref, () => ({
    find: () => {
      if (viewRef.current) openSearchPanel(viewRef.current)
    },
    step: (dir) => {
      const view = viewRef.current
      if (view) (dir === 1 ? findNext : findPrevious)(view)
    }
  }))
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const t = translator(lang)
    const state = EditorState.create({
      doc: initialText,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        EditorView.lineWrapping,
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        isDark() ? oneDark : syntaxHighlighting(defaultHighlightStyle),
        // Cmd/Ctrl+F llega por el menú (ver App), no por el keymap.
        search({ top: true }),
        EditorState.phrases.of({
          Find: t('cm.find'),
          Replace: t('cm.replace'),
          next: t('cm.next'),
          previous: t('cm.previous'),
          all: t('cm.all'),
          'match case': t('cm.matchCase'),
          'by word': t('cm.byWord'),
          regexp: t('cm.regexp'),
          replace: t('cm.replaceOne'),
          'replace all': t('cm.replaceAll'),
          close: t('cm.close'),
          'current match': t('cm.currentMatch'),
          'on line': t('cm.onLine'),
          'replaced match on line $': t('cm.replacedOnLine'),
          'replaced $ matches': t('cm.replacedN')
        }),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString())
        })
      ]
    })
    const view = new EditorView({ state, parent: root })
    viewRef.current = view
    view.focus()
    return () => {
      viewRef.current = null
      view.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={rootRef} className="lumen-source" />
})
