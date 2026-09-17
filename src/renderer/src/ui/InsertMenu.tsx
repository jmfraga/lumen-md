import { useEffect, useRef, useState } from 'react'
import type { InsertKind } from '../editor/insert'

interface Props {
  disabled?: boolean
  onInsert: (kind: InsertKind) => void
  onInsertTable: (rows: number, cols: number) => void
}

const ITEMS: Array<{ kind: InsertKind; label: string; hint?: string } | 'sep' | 'table'> = [
  { kind: 'h1', label: 'Título 1', hint: '#' },
  { kind: 'h2', label: 'Título 2', hint: '##' },
  { kind: 'h3', label: 'Título 3', hint: '###' },
  { kind: 'paragraph', label: 'Texto normal' },
  'sep',
  { kind: 'bullet-list', label: 'Lista con viñetas', hint: '-' },
  { kind: 'ordered-list', label: 'Lista numerada', hint: '1.' },
  { kind: 'task-list', label: 'Lista de tareas', hint: '[ ]' },
  { kind: 'quote', label: 'Cita', hint: '>' },
  { kind: 'divider', label: 'Separador', hint: '---' },
  'sep',
  'table',
  { kind: 'code', label: 'Bloque de código', hint: '```' },
  { kind: 'mermaid', label: 'Diagrama Mermaid' },
  { kind: 'math', label: 'Fórmula LaTeX', hint: '$$' },
  { kind: 'image', label: 'Imagen' }
]

const GRID = 8

/** Botón "Insertar" con menú de bloques y selector de cuadrícula para tablas. */
export function InsertMenu({ disabled, onInsert, onInsertTable }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [grid, setGrid] = useState<{ r: number; c: number }>({ r: 0, c: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // preventDefault en mousedown: el editor no pierde la selección al usar el menú.
  const keepFocus = (e: React.MouseEvent): void => e.preventDefault()

  return (
    <div className="lumen-insert" ref={ref}>
      <button
        type="button"
        className={open ? 'active' : ''}
        disabled={disabled}
        onMouseDown={keepFocus}
        onClick={() => setOpen((o) => !o)}
        title="Insertar un bloque (o escribe / en una línea vacía)"
      >
        + Insertar
      </button>
      {open && (
        <div className="lumen-insert-menu" role="menu" onMouseDown={keepFocus}>
          {ITEMS.map((item, i) => {
            if (item === 'sep') return <div key={i} className="lumen-insert-sep" />
            if (item === 'table') {
              return (
                <div key="table" className="lumen-insert-table">
                  <div className="lumen-insert-label">
                    Tabla {grid.r > 0 ? `${grid.r} × ${grid.c}` : ''}
                  </div>
                  <div className="lumen-insert-grid" onMouseLeave={() => setGrid({ r: 0, c: 0 })}>
                    {Array.from({ length: GRID * GRID }, (_, k) => {
                      const r = Math.floor(k / GRID) + 1
                      const c = (k % GRID) + 1
                      const on = r <= grid.r && c <= grid.c
                      return (
                        <button
                          type="button"
                          key={k}
                          className={on ? 'on' : ''}
                          onMouseEnter={() => setGrid({ r, c })}
                          onClick={() => {
                            setOpen(false)
                            onInsertTable(r, c)
                          }}
                          aria-label={`Tabla de ${r} filas por ${c} columnas`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            }
            return (
              <button
                type="button"
                key={item.kind}
                role="menuitem"
                className="lumen-insert-item"
                onClick={() => {
                  setOpen(false)
                  onInsert(item.kind)
                }}
              >
                <span>{item.label}</span>
                {item.hint && <code>{item.hint}</code>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
