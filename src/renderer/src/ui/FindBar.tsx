import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { clearPaint, findRanges, paintRanges, revealRange } from '../editor/find'
import { useI18n } from '../i18n'

export interface FindBarHandle {
  /** Enfoca el campo y selecciona su texto (Cmd/Ctrl+F con la barra ya abierta). */
  focus: () => void
  /** Salta a la coincidencia siguiente (1) o anterior (-1). */
  step: (dir: 1 | -1) => void
}

interface Props {
  /** Contenedor con scroll que envuelve al editor; se observa para recalcular al editar. */
  scroller: () => HTMLElement | null
  /** Al cerrar recibe la coincidencia actual, para dejar el cursor ahí. */
  onClose: (current: Range | null) => void
}

/** Barra de búsqueda de la vista WYSIWYG. La de fuente usa el panel de CodeMirror. */
export const FindBar = forwardRef<FindBarHandle, Props>(function FindBar(
  { scroller, onClose },
  ref
): React.JSX.Element {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(0)
  const [current, setCurrent] = useState(0)
  const ranges = useRef<Range[]>([])
  const currentRef = useRef(0)

  const show = useCallback(
    (i: number, reveal: boolean) => {
      currentRef.current = i
      setCurrent(i)
      paintRanges(ranges.current, i)
      const sc = scroller()
      if (reveal && sc && ranges.current[i]) revealRange(ranges.current[i], sc)
    },
    [scroller]
  )

  const recompute = useCallback(
    (q: string, reveal: boolean) => {
      const root = scroller()?.querySelector<HTMLElement>('.lumen-wysiwyg')
      ranges.current = root ? findRanges(root, q) : []
      setCount(ranges.current.length)
      show(Math.min(currentRef.current, Math.max(ranges.current.length - 1, 0)), reveal)
    },
    [scroller, show]
  )

  const step = useCallback(
    (dir: 1 | -1) => {
      const n = ranges.current.length
      if (n) show((currentRef.current + dir + n) % n, true)
    },
    [show]
  )

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    },
    step
  }))

  // Texto nuevo: vuelve a la primera coincidencia.
  useEffect(() => {
    currentRef.current = 0
    recompute(query, true)
  }, [query, recompute])

  // Si el documento cambia con la barra abierta, recalcula sin mover la vista.
  useEffect(() => {
    const sc = scroller()
    if (!sc) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const obs = new MutationObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(() => recompute(query, false), 150)
    })
    obs.observe(sc, { subtree: true, childList: true, characterData: true })
    return () => {
      obs.disconnect()
      clearTimeout(timer)
    }
  }, [scroller, query, recompute])

  useEffect(() => {
    inputRef.current?.focus()
    return clearPaint
  }, [])

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      step(e.shiftKey ? -1 : 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose(ranges.current[currentRef.current] ?? null)
    }
  }

  return (
    <div className="lumen-find" role="search">
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={t('find.placeholder')}
        aria-label={t('find.placeholder')}
        spellCheck={false}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <span className="lumen-find-count" aria-live="polite">
        {query ? (count ? t('find.count', { i: current + 1, n: count }) : t('find.none')) : ''}
      </span>
      <button title={t('find.prev')} aria-label={t('find.prev')} onClick={() => step(-1)}>
        ↑
      </button>
      <button title={t('find.next')} aria-label={t('find.next')} onClick={() => step(1)}>
        ↓
      </button>
      <button
        title={t('find.close')}
        aria-label={t('find.close')}
        onClick={() => onClose(ranges.current[currentRef.current] ?? null)}
      >
        ×
      </button>
    </div>
  )
})
