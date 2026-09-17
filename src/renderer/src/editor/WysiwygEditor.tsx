import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Ctx } from '@milkdown/kit/ctx'
import { Crepe } from '@milkdown/crepe'
import { editorViewCtx } from '@milkdown/kit/core'
import { frontmatter } from './frontmatter'
import { configureSerialization, postProcessMarkdown } from './serialization'
import { insertCodeBlockWithContent, MERMAID_TEMPLATE } from './insert'
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

export interface WysiwygHandle {
  /** Ejecuta una acción con el ctx de Milkdown (inserciones, comandos). */
  run: (fn: (ctx: Ctx) => void) => void
}

/** Milkdown Crepe. Se monta una vez por documento; el texto vive en DocumentStore. */
export const WysiwygEditor = forwardRef<WysiwygHandle, Props>(function WysiwygEditor(
  { initialText, baseDir, onChange },
  ref
): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const crepeRef = useRef<Crepe | null>(null)

  useImperativeHandle(ref, () => ({
    run: (fn) => {
      const crepe = crepeRef.current
      if (!crepe) return
      crepe.editor.action(fn)
    }
  }))
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

    const MERMAID_ICON =
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="7" height="5" rx="1"/><rect x="14" y="4" width="7" height="5" rx="1"/><rect x="8.5" y="15" width="7" height="5" rx="1"/><path d="M6.5 9v3h11V9M12 12v3"/></svg>'
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
        [Crepe.Feature.BlockEdit]: {
          textGroup: {
            label: 'Texto',
            text: { label: 'Texto normal' },
            h1: { label: 'Título 1' },
            h2: { label: 'Título 2' },
            h3: { label: 'Título 3' },
            h4: { label: 'Título 4' },
            h5: { label: 'Título 5' },
            h6: { label: 'Título 6' },
            quote: { label: 'Cita' },
            divider: { label: 'Separador' }
          },
          listGroup: {
            label: 'Listas',
            bulletList: { label: 'Lista con viñetas' },
            orderedList: { label: 'Lista numerada' },
            taskList: { label: 'Lista de tareas' }
          },
          advancedGroup: {
            label: 'Bloques',
            image: { label: 'Imagen' },
            codeBlock: { label: 'Bloque de código' },
            table: { label: 'Tabla' },
            math: { label: 'Fórmula LaTeX' }
          },
          buildMenu: (builder) => {
            builder.getGroup('advanced').addItem('mermaid', {
              label: 'Diagrama Mermaid',
              icon: MERMAID_ICON,
              onRun: (ctx) => insertCodeBlockWithContent(ctx, 'mermaid', MERMAID_TEMPLATE)
            })
          }
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
    crepeRef.current = crepe
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
})
