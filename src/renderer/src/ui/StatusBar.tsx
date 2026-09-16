import type { ViewMode } from '../state/document'

interface Props {
  path: string | null
  autosave: boolean
  dirty: boolean
  status: string
  mode: ViewMode
  text: string
}

function countWords(text: string): number {
  const m = text.replace(/```[\s\S]*?```/g, ' ').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)
  return m ? m.length : 0
}

export function StatusBar(p: Props): React.JSX.Element {
  return (
    <footer className="lumen-statusbar">
      <span className="lumen-status-path" title={p.path ?? ''}>
        {p.path ?? 'Documento nuevo (sin guardar)'}
      </span>
      <span className="lumen-status-right">
        {p.status && <span className="lumen-status-msg">{p.status}</span>}
        <span>{countWords(p.text)} palabras</span>
        <span>{p.mode === 'source' ? 'Fuente' : 'WYSIWYG'}</span>
        <span title="Autoguardado">
          {p.autosave ? 'Auto ✓' : p.dirty ? 'Sin guardar' : 'Manual'}
        </span>
      </span>
    </footer>
  )
}
