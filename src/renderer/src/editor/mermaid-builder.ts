/**
 * Generador de código Mermaid a partir de formularios. Puro: sin DOM, probable en Node.
 * Cubre los dos tipos que más producen las herramientas de IA: flujo y secuencia.
 */

export type NodeShape = 'rect' | 'round' | 'diamond' | 'circle'
export type EdgeStyle = 'arrow' | 'dotted' | 'thick' | 'line'
export type FlowDirection = 'LR' | 'TD' | 'RL' | 'BT'

export interface FlowNode {
  id: string
  label: string
  shape: NodeShape
}
export interface FlowEdge {
  from: string
  to: string
  label: string
  style: EdgeStyle
}
export interface FlowchartSpec {
  direction: FlowDirection
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export type MessageStyle = 'sync' | 'async' | 'reply' | 'dotted'
export interface SeqParticipant {
  id: string
  label: string
}
export interface SeqMessage {
  from: string
  to: string
  text: string
  style: MessageStyle
}
export interface SequenceSpec {
  participants: SeqParticipant[]
  messages: SeqMessage[]
}

export type DiagramSpec =
  { kind: 'flowchart'; flow: FlowchartSpec } | { kind: 'sequence'; seq: SequenceSpec }

/** Identificadores A, B, …, Z, AA, AB… */
export function nodeId(index: number): string {
  let n = index
  let s = ''
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

function q(label: string): string {
  // Mermaid acepta etiquetas entre comillas; dentro, las comillas se escapan como #quot;
  return `"${label.replace(/"/g, '#quot;').trim() || ' '}"`
}

function shapeWrap(shape: NodeShape, label: string): string {
  const l = q(label)
  switch (shape) {
    case 'round':
      return `(${l})`
    case 'diamond':
      return `{${l}}`
    case 'circle':
      return `((${l}))`
    default:
      return `[${l}]`
  }
}

function edgeArrow(style: EdgeStyle): string {
  switch (style) {
    case 'dotted':
      return '-.->'
    case 'thick':
      return '==>'
    case 'line':
      return '---'
    default:
      return '-->'
  }
}

export function buildFlowchart(spec: FlowchartSpec): string {
  const lines = [`flowchart ${spec.direction}`]
  for (const n of spec.nodes) lines.push(`  ${n.id}${shapeWrap(n.shape, n.label || n.id)}`)
  for (const e of spec.edges) {
    if (!e.from || !e.to) continue
    const label = e.label.trim() ? `|${q(e.label)}|` : ''
    lines.push(`  ${e.from} ${edgeArrow(e.style)}${label} ${e.to}`)
  }
  return lines.join('\n')
}

function messageArrow(style: MessageStyle): string {
  switch (style) {
    case 'async':
      return '-)'
    case 'reply':
      return '-->>'
    case 'dotted':
      return '-->'
    default:
      return '->>'
  }
}

export function buildSequence(spec: SequenceSpec): string {
  const lines = ['sequenceDiagram']
  for (const p of spec.participants) {
    const label = p.label.trim()
    lines.push(
      label && label !== p.id
        ? `  participant ${p.id} as ${label.replace(/\n/g, ' ')}`
        : `  participant ${p.id}`
    )
  }
  for (const m of spec.messages) {
    if (!m.from || !m.to) continue
    lines.push(
      `  ${m.from}${messageArrow(m.style)}${m.to}: ${m.text.replace(/\n/g, ' ').trim() || ' '}`
    )
  }
  return lines.join('\n')
}

export function buildDiagram(spec: DiagramSpec): string {
  return spec.kind === 'flowchart' ? buildFlowchart(spec.flow) : buildSequence(spec.seq)
}

export function defaultFlowchart(): FlowchartSpec {
  return {
    direction: 'LR',
    nodes: [
      { id: 'A', label: 'Inicio', shape: 'round' },
      { id: 'B', label: '¿Decisión?', shape: 'diamond' },
      { id: 'C', label: 'Resultado', shape: 'rect' }
    ],
    edges: [
      { from: 'A', to: 'B', label: '', style: 'arrow' },
      { from: 'B', to: 'C', label: 'Sí', style: 'arrow' }
    ]
  }
}

export function defaultSequence(): SequenceSpec {
  return {
    participants: [
      { id: 'A', label: 'Paciente' },
      { id: 'B', label: 'Médico' }
    ],
    messages: [
      { from: 'A', to: 'B', text: 'Consulta', style: 'sync' },
      { from: 'B', to: 'A', text: 'Indicaciones', style: 'reply' }
    ]
  }
}
