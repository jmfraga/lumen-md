import type { ViewMode } from '../state/document'

interface Props {
  name: string
  dirty: boolean
  mode: ViewMode
  onToggleSource: () => void
  onOpen: () => void
  onSave: () => void
  onExportHtml: () => void
  onExportPdf: () => void
}

export function TopBar(p: Props): React.JSX.Element {
  return (
    <header className="lumen-topbar">
      <div className="lumen-topbar-title" title={p.name}>
        {p.dirty ? '• ' : ''}
        {p.name}
      </div>
      <div className="lumen-topbar-actions">
        <button type="button" onClick={p.onOpen} title="Abrir (⌘O)">
          Abrir
        </button>
        <button type="button" onClick={p.onSave} title="Guardar (⌘S)">
          Guardar
        </button>
        <span className="lumen-sep" />
        <button type="button" onClick={p.onExportHtml} title="Exportar a HTML">
          HTML
        </button>
        <button type="button" onClick={p.onExportPdf} title="Exportar a PDF (⌘P)">
          PDF
        </button>
        <span className="lumen-sep" />
        <button
          type="button"
          className={p.mode === 'source' ? 'active' : ''}
          onClick={p.onToggleSource}
          title="Alternar fuente Markdown (⌘/)"
        >
          {p.mode === 'source' ? 'Vista' : 'Fuente'}
        </button>
      </div>
    </header>
  )
}
