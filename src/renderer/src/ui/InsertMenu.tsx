import { useEffect, useRef, useState } from 'react'
import type { InsertKind } from '../editor/insert'
import type { MessageKey } from '../../../shared/i18n'
import { useI18n } from '../i18n'

interface Props {
  disabled?: boolean
  onInsert: (kind: InsertKind) => void
  onInsertTable: (rows: number, cols: number) => void
}

const ITEMS: Array<{ kind: InsertKind; label: MessageKey; hint?: string } | 'sep' | 'table'> = [
  { kind: 'h1', label: 'insert.h1', hint: '#' },
  { kind: 'h2', label: 'insert.h2', hint: '##' },
  { kind: 'h3', label: 'insert.h3', hint: '###' },
  { kind: 'paragraph', label: 'insert.paragraph' },
  'sep',
  { kind: 'bullet-list', label: 'insert.bulletList', hint: '-' },
  { kind: 'ordered-list', label: 'insert.orderedList', hint: '1.' },
  { kind: 'task-list', label: 'insert.taskList', hint: '[ ]' },
  { kind: 'quote', label: 'insert.quote', hint: '>' },
  { kind: 'divider', label: 'insert.divider', hint: '---' },
  'sep',
  'table',
  { kind: 'code', label: 'insert.code', hint: '```' },
  { kind: 'mermaid', label: 'insert.mermaid' },
  { kind: 'math', label: 'insert.math', hint: '$$' },
  { kind: 'image', label: 'insert.image' }
]

const GRID = 8

/** Botón "Insertar" con menú de bloques y selector de cuadrícula para tablas. */
export function InsertMenu({ disabled, onInsert, onInsertTable }: Props): React.JSX.Element {
  const { t } = useI18n()
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
        title={t('topbar.insertTitle')}
      >
        {t('topbar.insert')}
      </button>
      {open && (
        <div className="lumen-insert-menu" role="menu" onMouseDown={keepFocus}>
          {ITEMS.map((item, i) => {
            if (item === 'sep') return <div key={i} className="lumen-insert-sep" />
            if (item === 'table') {
              return (
                <div key="table" className="lumen-insert-table">
                  <div className="lumen-insert-label">
                    {t('insert.table')} {grid.r > 0 ? `${grid.r} × ${grid.c}` : ''}
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
                          aria-label={t('insert.tableSize', { r, c })}
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
                <span>{t(item.label)}</span>
                {item.hint && <code>{item.hint}</code>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
