import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Ctx } from '@milkdown/kit/ctx'
import { Crepe } from '@milkdown/crepe'
import { editorViewCtx } from '@milkdown/kit/core'
import { frontmatter } from './frontmatter'
import { configureSerialization, postProcessMarkdown } from './serialization'
import { insertCodeBlockWithContent, mermaidTemplate } from './insert'
import {
  saveImageAsset,
  imageFilesFromClipboard,
  insertImageBlock,
  DocumentNotSavedError
} from './image-upload'
import { translator, type Lang, type Message } from '../../../shared/i18n'
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
  /** Ruta del documento; necesaria para copiar imágenes a assets/. */
  docPath: string | null
  onChange: (markdown: string) => void
  /** Mensajes para la barra de estado (errores de imagen, etc.). */
  onStatus?: (msg: Message) => void
  /** Idioma de los textos del editor. Cambiarlo remonta el editor (la key del componente lo fuerza). */
  lang: Lang
}

export interface WysiwygHandle {
  /** Ejecuta una acción con el ctx de Milkdown (inserciones, comandos). */
  run: (fn: (ctx: Ctx) => void) => void
}

/** Milkdown Crepe. Se monta una vez por documento; el texto vive en DocumentStore. */
export const WysiwygEditor = forwardRef<WysiwygHandle, Props>(function WysiwygEditor(
  { initialText, baseDir, docPath, onChange, onStatus, lang },
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
  const onStatusRef = useRef(onStatus)
  const docPathRef = useRef(docPath)
  useEffect(() => {
    onChangeRef.current = onChange
    onStatusRef.current = onStatus
    docPathRef.current = docPath
  }, [onChange, onStatus, docPath])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let destroyed = false
    const t = translator(lang)
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
    const upload = async (file: File): Promise<string> => {
      try {
        const rel = await saveImageAsset(file, docPathRef.current)
        onStatusRef.current?.({ key: 'msg.imageSaved', vars: { path: rel } })
        return rel
      } catch (err) {
        onStatusRef.current?.({
          key: err instanceof DocumentNotSavedError ? 'msg.imageNeedsSave' : 'msg.imageError'
        })
        throw err
      }
    }
    // Pegar una imagen del portapapeles: se guarda en assets/ y se inserta como bloque.
    const onPaste = (e: ClipboardEvent): void => {
      const files = imageFilesFromClipboard(e.clipboardData)
      if (!files.length) return
      e.preventDefault()
      e.stopPropagation()
      void (async () => {
        for (const f of files) {
          try {
            const rel = await upload(f)
            crepe.editor.action((ctx) => insertImageBlock(ctx, rel))
          } catch {
            /* ya se informó en la barra de estado */
          }
        }
      })()
    }
    root.addEventListener('paste', onPaste, true)

    const crepe = new Crepe({
      root,
      defaultValue: initialText,
      features: {
        [Crepe.Feature.Latex]: true
      },
      featureConfigs: {
        [Crepe.Feature.Toolbar]: {
          boldLabel: t('editor.bold'),
          italicLabel: t('editor.italic'),
          strikethroughLabel: t('editor.strikethrough'),
          codeLabel: t('editor.inlineCode'),
          latexLabel: t('editor.latex'),
          linkLabel: t('editor.link')
        },
        [Crepe.Feature.BlockEdit]: {
          textGroup: {
            label: t('slash.text'),
            text: { label: t('insert.paragraph') },
            h1: { label: t('insert.h1') },
            h2: { label: t('insert.h2') },
            h3: { label: t('insert.h3') },
            h4: { label: t('insert.h4') },
            h5: { label: t('insert.h5') },
            h6: { label: t('insert.h6') },
            quote: { label: t('insert.quote') },
            divider: { label: t('insert.divider') }
          },
          listGroup: {
            label: t('slash.lists'),
            bulletList: { label: t('insert.bulletList') },
            orderedList: { label: t('insert.orderedList') },
            taskList: { label: t('insert.taskList') }
          },
          advancedGroup: {
            label: t('slash.blocks'),
            image: { label: t('insert.image') },
            codeBlock: { label: t('insert.code') },
            table: { label: t('insert.table') },
            math: { label: t('insert.math') }
          },
          buildMenu: (builder) => {
            builder.getGroup('advanced').addItem('mermaid', {
              label: t('insert.mermaid'),
              icon: MERMAID_ICON,
              onRun: (ctx) => insertCodeBlockWithContent(ctx, 'mermaid', mermaidTemplate(lang))
            })
          }
        },
        [Crepe.Feature.Placeholder]: { text: t('editor.placeholder'), mode: 'doc' },
        [Crepe.Feature.CodeMirror]: {
          renderPreview: (language, content, applyPreview) => {
            if (language.toLowerCase() !== 'mermaid' || !content.trim()) return null
            void renderMermaid(content).then((svg) => {
              if (!svg) return applyPreview(t('editor.mermaidInvalid'))
              const holder = document.createElement('div')
              holder.className = 'lumen-mermaid-preview'
              holder.innerHTML = svg
              applyPreview(holder)
            })
            return undefined
          },
          previewLabel: t('editor.preview'),
          previewOnlyByDefault: true
        },
        [Crepe.Feature.ImageBlock]: {
          proxyDomURL: (url: string) => resolveAssetUrl(url, baseDir),
          onUpload: upload,
          blockOnUpload: upload,
          inlineOnUpload: upload,
          blockUploadButton: t('editor.chooseFile'),
          blockUploadPlaceholderText: t('editor.imagePlaceholder'),
          blockCaptionPlaceholderText: t('editor.caption'),
          blockConfirmButton: t('editor.confirm'),
          inlineUploadButton: t('editor.chooseFile'),
          inlineUploadPlaceholderText: t('editor.imagePlaceholder'),
          inlineConfirmButton: t('editor.confirm')
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
