import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DocumentStore, useDocument } from './state/document'
import { WysiwygEditor } from './editor/WysiwygEditor'
import type { WysiwygHandle } from './editor/WysiwygEditor'
import { insert, insertTable, insertCodeBlockWithContent } from './editor/insert'
import type { InsertKind } from './editor/insert'
import { SourceEditor } from './editor/SourceEditor'
import { buildExportHtml } from './export'
import { TopBar } from './ui/TopBar'
import { StatusBar } from './ui/StatusBar'
import { DropOverlay } from './ui/DropOverlay'
import { MermaidWizard } from './ui/MermaidWizard'
import type { MenuCommand } from '../../shared/ipc'

function dirOf(path: string | null): string | null {
  if (!path) return null
  const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))
  return i > 0 ? path.slice(0, i) : null
}

function nameOf(path: string | null): string {
  if (!path) return 'Sin título'
  return path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1)
}

export default function App(): React.JSX.Element {
  const store = useMemo(
    () =>
      new DocumentStore({
        save: async (path, text) => (await window.lumen.saveFile(path, text)).ok
      }),
    []
  )
  const doc = useDocument(store)
  const [loaded, setLoaded] = useState(false)
  /** Cambia para forzar el remontado de los editores al cargar otro documento o cambiar de modo. */
  const [epoch, setEpoch] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [wizard, setWizard] = useState(false)
  const busy = useRef(false)
  const editorRef = useRef<WysiwygHandle>(null)

  const loadPath = useCallback(
    async (path: string) => {
      const file = await window.lumen.readFile(path)
      store.load(file.path, file.content)
      window.lumen.setCurrentPath(file.path)
      setEpoch((e) => e + 1)
    },
    [store]
  )

  // Arranque: archivo inicial y preferencias.
  useEffect(() => {
    void (async () => {
      const prefs = await window.lumen.getPreferences()
      store.setAutosave(prefs.autosave)
      const file = await window.lumen.getInitialFile()
      if (file) store.load(file.path, file.content)
      setLoaded(true)
    })()
  }, [store])

  // Sincroniza dirty con main (título, aviso al cerrar).
  useEffect(() => {
    window.lumen.setDirty(doc.dirty)
  }, [doc.dirty])

  useEffect(() => window.lumen.onOpenPath((p) => void loadPath(p)), [loadPath])

  const saveAs = useCallback(async () => {
    const res = await window.lumen.saveFileAs(
      store.get().text,
      nameOf(store.get().path).replace(/\.[^.]+$/, '')
    )
    if (res.ok && res.path) store.markSavedAs(res.path)
  }, [store])

  const save = useCallback(async () => {
    if (store.get().path) await store.save()
    else await saveAs()
  }, [store, saveAs])

  const exportAs = useCallback(
    async (kind: 'html' | 'pdf') => {
      if (busy.current) return
      busy.current = true
      store.setStatus(kind === 'pdf' ? 'Generando PDF…' : 'Generando HTML…')
      try {
        const { text, path } = store.get()
        const title = nameOf(path).replace(/\.[^.]+$/, '')
        const html = await buildExportHtml(text, title, dirOf(path))
        const res =
          kind === 'pdf'
            ? await window.lumen.exportPdf(html, title)
            : await window.lumen.exportHtml(html, title)
        store.setStatus(res.ok ? `Exportado: ${res.path}` : res.error ? `Error: ${res.error}` : '')
      } finally {
        busy.current = false
      }
    },
    [store]
  )

  const toggleSource = useCallback(() => {
    store.setMode(store.get().mode === 'wysiwyg' ? 'source' : 'wysiwyg')
    setEpoch((e) => e + 1)
  }, [store])

  const toggleAutosave = useCallback(async () => {
    const prefs = await window.lumen.setPreferences({ autosave: !store.get().autosave })
    store.setAutosave(prefs.autosave)
  }, [store])

  // Comandos del menú nativo.
  useEffect(() => {
    return window.lumen.onCommand((cmd: MenuCommand) => {
      switch (cmd) {
        case 'save':
          void save()
          break
        case 'save-as':
          void saveAs()
          break
        case 'export-html':
          void exportAs('html')
          break
        case 'export-pdf':
          void exportAs('pdf')
          break
        case 'toggle-source':
          toggleSource()
          break
        case 'toggle-autosave':
          void toggleAutosave()
          break
      }
    })
  }, [save, saveAs, exportAs, toggleSource, toggleAutosave])

  // Guardar al perder el foco de la ventana (autosave).
  useEffect(() => {
    const onBlur = (): void => {
      if (store.get().autosave) void store.flushAutosave()
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [store])

  // Drag & drop de archivos.
  useEffect(() => {
    const onDragOver = (e: DragEvent): void => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault()
        setDragging(true)
      }
    }
    const onDragLeave = (e: DragEvent): void => {
      if (!e.relatedTarget) setDragging(false)
    }
    const onDrop = (e: DragEvent): void => {
      setDragging(false)
      const files = Array.from(e.dataTransfer?.files ?? [])
      if (!files.length) return
      e.preventDefault()
      const paths = files
        .map((f) => window.lumen.pathForFile(f))
        .filter((p) => /\.(md|markdown|mdx|txt)$/i.test(p))
      if (!paths.length) return
      // main decide: reutiliza esta ventana si está vacía y limpia, si no abre otra.
      paths.forEach((p) => void window.lumen.openPath(p))
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [store, loadPath])

  const onChange = useCallback((text: string) => store.update(text), [store])
  const onStatus = useCallback((msg: string) => store.setStatus(msg), [store])
  const onInsert = useCallback((kind: InsertKind) => {
    if (kind === 'mermaid') return setWizard(true)
    editorRef.current?.run((ctx) => insert(ctx, kind))
  }, [])
  const onInsertMermaid = useCallback((code: string) => {
    setWizard(false)
    editorRef.current?.run((ctx) => insertCodeBlockWithContent(ctx, 'mermaid', code))
  }, [])
  const onInsertTable = useCallback(
    (rows: number, cols: number) => editorRef.current?.run((ctx) => insertTable(ctx, rows, cols)),
    []
  )

  if (!loaded) return <div className="lumen-app" />

  return (
    <div className="lumen-app">
      <TopBar
        name={nameOf(doc.path)}
        dirty={doc.dirty}
        mode={doc.mode}
        onToggleSource={toggleSource}
        onOpen={() => void window.lumen.openFileDialog()}
        onSave={() => void save()}
        onExportHtml={() => void exportAs('html')}
        onExportPdf={() => void exportAs('pdf')}
        onInsert={onInsert}
        onInsertTable={onInsertTable}
      />
      <main className="lumen-main">
        {doc.mode === 'wysiwyg' ? (
          <WysiwygEditor
            ref={editorRef}
            key={`w${epoch}`}
            initialText={doc.text}
            baseDir={dirOf(doc.path)}
            docPath={doc.path}
            onChange={onChange}
            onStatus={onStatus}
          />
        ) : (
          <SourceEditor key={`s${epoch}`} initialText={doc.text} onChange={onChange} />
        )}
      </main>
      <StatusBar
        path={doc.path}
        autosave={doc.autosave}
        dirty={doc.dirty}
        status={doc.status}
        mode={doc.mode}
        text={doc.text}
      />
      {wizard && <MermaidWizard onInsert={onInsertMermaid} onClose={() => setWizard(false)} />}
      {dragging && <DropOverlay />}
    </div>
  )
}
