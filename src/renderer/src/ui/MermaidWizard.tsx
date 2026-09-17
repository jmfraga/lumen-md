import { useEffect, useMemo, useState } from 'react'
import {
  buildDiagram,
  defaultFlowchart,
  defaultSequence,
  nodeId,
  type DiagramSpec,
  type FlowchartSpec,
  type SequenceSpec,
  type NodeShape,
  type EdgeStyle,
  type MessageStyle
} from '../editor/mermaid-builder'
import { renderMermaid } from '../editor/mermaid'

interface Props {
  onInsert: (code: string) => void
  onClose: () => void
}

const SHAPES: Array<[NodeShape, string]> = [
  ['rect', 'Rectángulo'],
  ['round', 'Redondeado'],
  ['diamond', 'Decisión'],
  ['circle', 'Círculo']
]
const EDGES: Array<[EdgeStyle, string]> = [
  ['arrow', 'Flecha'],
  ['dotted', 'Punteada'],
  ['thick', 'Gruesa'],
  ['line', 'Línea']
]
const MESSAGES: Array<[MessageStyle, string]> = [
  ['sync', 'Mensaje'],
  ['reply', 'Respuesta'],
  ['async', 'Asíncrono'],
  ['dotted', 'Punteado']
]

/** Asistente visual: formulario → código Mermaid → vista previa. Inserta un bloque ```mermaid. */
export function MermaidWizard({ onInsert, onClose }: Props): React.JSX.Element {
  const [kind, setKind] = useState<'flowchart' | 'sequence'>('flowchart')
  const [flow, setFlow] = useState<FlowchartSpec>(defaultFlowchart)
  const [seq, setSeq] = useState<SequenceSpec>(defaultSequence)
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState(false)

  const spec: DiagramSpec = useMemo(
    () => (kind === 'flowchart' ? { kind, flow } : { kind, seq }),
    [kind, flow, seq]
  )
  const code = useMemo(() => buildDiagram(spec), [spec])

  // Vista previa con pequeño retardo para no renderizar en cada tecla.
  useEffect(() => {
    let alive = true
    const t = setTimeout(() => {
      void renderMermaid(code).then((out) => {
        if (!alive) return
        setError(out === null)
        if (out) setSvg(out)
      })
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [code])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // --- helpers de edición ---
  const setNode = (i: number, patch: Partial<FlowchartSpec['nodes'][number]>): void =>
    setFlow((f) => ({ ...f, nodes: f.nodes.map((n, k) => (k === i ? { ...n, ...patch } : n)) }))
  const addNode = (): void =>
    setFlow((f) => ({
      ...f,
      nodes: [...f.nodes, { id: nodeId(f.nodes.length), label: '', shape: 'rect' }]
    }))
  const removeNode = (i: number): void =>
    setFlow((f) => {
      const id = f.nodes[i]?.id
      return {
        ...f,
        nodes: f.nodes.filter((_, k) => k !== i),
        edges: f.edges.filter((e) => e.from !== id && e.to !== id)
      }
    })
  const setEdge = (i: number, patch: Partial<FlowchartSpec['edges'][number]>): void =>
    setFlow((f) => ({ ...f, edges: f.edges.map((e, k) => (k === i ? { ...e, ...patch } : e)) }))
  const addEdge = (): void =>
    setFlow((f) => ({
      ...f,
      edges: [
        ...f.edges,
        {
          from: f.nodes[0]?.id ?? '',
          to: f.nodes[1]?.id ?? f.nodes[0]?.id ?? '',
          label: '',
          style: 'arrow'
        }
      ]
    }))
  const removeEdge = (i: number): void =>
    setFlow((f) => ({ ...f, edges: f.edges.filter((_, k) => k !== i) }))

  const setPart = (i: number, label: string): void =>
    setSeq((s) => ({
      ...s,
      participants: s.participants.map((p, k) => (k === i ? { ...p, label } : p))
    }))
  const addPart = (): void =>
    setSeq((s) => ({
      ...s,
      participants: [...s.participants, { id: nodeId(s.participants.length), label: '' }]
    }))
  const removePart = (i: number): void =>
    setSeq((s) => {
      const id = s.participants[i]?.id
      return {
        ...s,
        participants: s.participants.filter((_, k) => k !== i),
        messages: s.messages.filter((m) => m.from !== id && m.to !== id)
      }
    })
  const setMsg = (i: number, patch: Partial<SequenceSpec['messages'][number]>): void =>
    setSeq((s) => ({
      ...s,
      messages: s.messages.map((m, k) => (k === i ? { ...m, ...patch } : m))
    }))
  const addMsg = (): void =>
    setSeq((s) => ({
      ...s,
      messages: [
        ...s.messages,
        {
          from: s.participants[0]?.id ?? '',
          to: s.participants[1]?.id ?? s.participants[0]?.id ?? '',
          text: '',
          style: 'sync'
        }
      ]
    }))
  const removeMsg = (i: number): void =>
    setSeq((s) => ({ ...s, messages: s.messages.filter((_, k) => k !== i) }))

  const nodeOptions = (kind === 'flowchart' ? flow.nodes : seq.participants).map((n) => (
    <option key={n.id} value={n.id}>
      {n.id}
      {n.label && n.label !== n.id ? ` · ${n.label}` : ''}
    </option>
  ))

  return (
    <div
      className="lumen-modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="lumen-modal lumen-wizard"
        role="dialog"
        aria-label="Asistente de diagrama Mermaid"
      >
        <header className="lumen-wizard-head">
          <strong>Diagrama Mermaid</strong>
          <div className="lumen-wizard-kind">
            <button
              type="button"
              className={kind === 'flowchart' ? 'active' : ''}
              onClick={() => setKind('flowchart')}
            >
              Flujo
            </button>
            <button
              type="button"
              className={kind === 'sequence' ? 'active' : ''}
              onClick={() => setKind('sequence')}
            >
              Secuencia
            </button>
          </div>
        </header>

        <div className="lumen-wizard-body">
          <div className="lumen-wizard-form">
            {kind === 'flowchart' ? (
              <>
                <label className="lumen-field">
                  Dirección
                  <select
                    value={flow.direction}
                    onChange={(e) =>
                      setFlow({ ...flow, direction: e.target.value as FlowchartSpec['direction'] })
                    }
                  >
                    <option value="LR">Izquierda → derecha</option>
                    <option value="TD">Arriba → abajo</option>
                    <option value="RL">Derecha → izquierda</option>
                    <option value="BT">Abajo → arriba</option>
                  </select>
                </label>

                <h4>Nodos</h4>
                {flow.nodes.map((n, i) => (
                  <div className="lumen-row" key={n.id}>
                    <code>{n.id}</code>
                    <input
                      value={n.label}
                      placeholder="Texto del nodo"
                      onChange={(e) => setNode(i, { label: e.target.value })}
                      autoFocus={i === 0}
                    />
                    <select
                      value={n.shape}
                      onChange={(e) => setNode(i, { shape: e.target.value as NodeShape })}
                    >
                      {SHAPES.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="lumen-x"
                      onClick={() => removeNode(i)}
                      title="Quitar nodo"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="lumen-add" onClick={addNode}>
                  + Nodo
                </button>

                <h4>Conexiones</h4>
                {flow.edges.map((e, i) => (
                  <div className="lumen-row" key={i}>
                    <select value={e.from} onChange={(ev) => setEdge(i, { from: ev.target.value })}>
                      {nodeOptions}
                    </select>
                    <select
                      value={e.style}
                      onChange={(ev) => setEdge(i, { style: ev.target.value as EdgeStyle })}
                    >
                      {EDGES.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <select value={e.to} onChange={(ev) => setEdge(i, { to: ev.target.value })}>
                      {nodeOptions}
                    </select>
                    <input
                      value={e.label}
                      placeholder="Etiqueta (opcional)"
                      onChange={(ev) => setEdge(i, { label: ev.target.value })}
                    />
                    <button
                      type="button"
                      className="lumen-x"
                      onClick={() => removeEdge(i)}
                      title="Quitar conexión"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="lumen-add" onClick={addEdge}>
                  + Conexión
                </button>
              </>
            ) : (
              <>
                <h4>Participantes</h4>
                {seq.participants.map((p, i) => (
                  <div className="lumen-row" key={p.id}>
                    <code>{p.id}</code>
                    <input
                      value={p.label}
                      placeholder="Nombre"
                      onChange={(e) => setPart(i, e.target.value)}
                      autoFocus={i === 0}
                    />
                    <button
                      type="button"
                      className="lumen-x"
                      onClick={() => removePart(i)}
                      title="Quitar participante"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="lumen-add" onClick={addPart}>
                  + Participante
                </button>

                <h4>Mensajes</h4>
                {seq.messages.map((m, i) => (
                  <div className="lumen-row" key={i}>
                    <select value={m.from} onChange={(e) => setMsg(i, { from: e.target.value })}>
                      {nodeOptions}
                    </select>
                    <select
                      value={m.style}
                      onChange={(e) => setMsg(i, { style: e.target.value as MessageStyle })}
                    >
                      {MESSAGES.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <select value={m.to} onChange={(e) => setMsg(i, { to: e.target.value })}>
                      {nodeOptions}
                    </select>
                    <input
                      value={m.text}
                      placeholder="Texto del mensaje"
                      onChange={(e) => setMsg(i, { text: e.target.value })}
                    />
                    <button
                      type="button"
                      className="lumen-x"
                      onClick={() => removeMsg(i)}
                      title="Quitar mensaje"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" className="lumen-add" onClick={addMsg}>
                  + Mensaje
                </button>
              </>
            )}
          </div>

          <div className="lumen-wizard-preview">
            <div
              className={`lumen-wizard-svg${error ? ' error' : ''}`}
              dangerouslySetInnerHTML={{ __html: svg ?? '' }}
            />
            {error && (
              <div className="lumen-wizard-error">
                El diagrama no es válido todavía; revisa las conexiones.
              </div>
            )}
            <details>
              <summary>Código generado</summary>
              <pre>
                <code>{code}</code>
              </pre>
            </details>
          </div>
        </div>

        <footer className="lumen-wizard-foot">
          <span className="lumen-hint">
            Después de insertarlo puedes seguir editando el código en el bloque.
          </span>
          <div>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="primary"
              disabled={error}
              onClick={() => onInsert(code)}
            >
              Insertar diagrama
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
