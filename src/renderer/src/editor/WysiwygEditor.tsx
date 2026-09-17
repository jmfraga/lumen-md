import { useEffect, useRef } from 'react'
import { Crepe } from '@milkdown/crepe'
import { editorViewCtx } from '@milkdown/kit/core'
import { frontmatter } from './frontmatter'
import { configureSerialization, postProcessMarkdown } from './serialization'
import { renderMermaid } from './mermaid'
import { resolveAssetUrl } from '../export/assets'

import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import 'katex/dist/katex.min.css'

interface Props {
  /** Texto con el que se monta el editor. Cambios posteriores recrean el editor. */
  initialText: string
  /** Directorio del documento, para resolver imágenes relativas. */
  baseDir: string | null
  onChange: (markdown: string) => void
}

/** Milkdown Crepe. Se monta una vez por documento; el texto vive en DocumentStore. */
export function WysiwygEditor({ initialText, baseDir, onChange }: Props): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let destroyed = false
    // Los plugins de Milkdown disparan transacciones internas al montar
    // (párrafo final, normalización). Nada de eso es una edición: solo
    // aceptamos cambios después de la primera interacción real del usuario.
    let userInteracted = false
    const markInteracted = (): void => {
      userInteracted = true
    }
    const interactionEvents = ['keydown', 'paste', 'drop', 'pointerdown', 'cut'] as const
    interactionEvents.forEach((ev) => root.addEventListener(ev, markInteracted, true))

    const crepe = new Crepe({
      root,
      defaultValue: initialText,
      features: {
        [Crepe.Feature.Latex]: true
      },
      featureConfigs: {
        [Crepe.Feature.Toolbar]: {
          boldLabel: 'Negritas',
          italicLabel: 'Cursivas',
          strikethroughLabel: 'Tachado',
          codeLabel: 'Código en línea',
          latexLabel: 'Fórmula LaTeX',
          linkLabel: 'Enlace'
        },
        [Crepe.Feature.Placeholder]: { text: 'Escribe aquí…', mode: 'doc' },
        [Crepe.Feature.CodeMirror]: {
          renderPreview: (language, content, applyPreview) => {
            if (language.toLowerCase() !== 'mermaid' || !content.trim()) return null
            void renderMermaid(content).then((svg) => {
              if (!svg) return applyPreview('Diagrama Mermaid inválido')
              const holder = document.createElement('div')
              holder.className = 'lumen-mermaid-preview'
              holder.innerHTML = svg
              applyPreview(holder)
            })
            return undefined
          },
          previewLabel: 'Vista previa',
          previewOnlyByDefault: true
        },
        [Crepe.Feature.ImageBlock]: {
          proxyDomURL: (url: string) => resolveAssetUrl(url, baseDir)
        }
      }
    })

    crepe.editor.use(frontmatter)
    configureSerialization(crepe.editor)
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown, prev) => {
        if (userInteracted && markdown !== prev) onChangeRef.current(postProcessMarkdown(markdown))
      })
    })

    void crepe.create().then(() => {
      if (destroyed) return void crepe.destroy()
      // Gancho de diagnóstico (capturas automatizadas, depuración desde DevTools).
      crepe.editor.action((ctx) => {
        ;(window as unknown as { __lumen?: unknown }).__lumen = { view: ctx.get(editorViewCtx) }
      })
    })

    return () => {
      destroyed = true
      interactionEvents.forEach((ev) => root.removeEventListener(ev, markInteracted, true))
      void crepe.destroy()
    }
    // initialText/baseDir cambian solo al cargar otro documento (la key del componente lo fuerza).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={rootRef} className="lumen-wysiwyg" />
}
