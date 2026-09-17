import { describe, it, expect } from 'vitest'
import {
  buildFlowchart,
  buildSequence,
  nodeId,
  defaultFlowchart,
  defaultSequence
} from '../src/renderer/src/editor/mermaid-builder'

describe('generador Mermaid', () => {
  it('ids A..Z, AA..', () => {
    expect([0, 1, 25, 26, 27].map(nodeId)).toEqual(['A', 'B', 'Z', 'AA', 'AB'])
  })

  it('flujo con formas, etiquetas y estilos de flecha', () => {
    const code = buildFlowchart({
      direction: 'TD',
      nodes: [
        { id: 'A', label: 'Inicio', shape: 'round' },
        { id: 'B', label: '¿Es "grave"?', shape: 'diamond' },
        { id: 'C', label: '', shape: 'circle' }
      ],
      edges: [
        { from: 'A', to: 'B', label: '', style: 'arrow' },
        { from: 'B', to: 'C', label: 'Sí', style: 'dotted' },
        { from: '', to: 'C', label: 'x', style: 'thick' }
      ]
    })
    expect(code).toBe(
      [
        'flowchart TD',
        '  A("Inicio")',
        '  B{"¿Es #quot;grave#quot;?"}',
        '  C(("C"))',
        '  A --> B',
        '  B -.->|"Sí"| C'
      ].join('\n')
    )
  })

  it('secuencia con alias y tipos de mensaje', () => {
    const code = buildSequence({
      participants: [
        { id: 'A', label: 'Paciente' },
        { id: 'B', label: 'B' }
      ],
      messages: [
        { from: 'A', to: 'B', text: 'Hola', style: 'sync' },
        { from: 'B', to: 'A', text: 'Respuesta', style: 'reply' },
        { from: 'A', to: 'B', text: 'Evento', style: 'async' }
      ]
    })
    expect(code).toBe(
      [
        'sequenceDiagram',
        '  participant A as Paciente',
        '  participant B',
        '  A->>B: Hola',
        '  B-->>A: Respuesta',
        '  A-)B: Evento'
      ].join('\n')
    )
  })

  it('las plantillas por defecto generan código', () => {
    expect(buildFlowchart(defaultFlowchart())).toContain('flowchart LR')
    expect(buildSequence(defaultSequence())).toContain('sequenceDiagram')
  })
})
