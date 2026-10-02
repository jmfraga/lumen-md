import { useEffect, useState } from 'react'
import type { UpdateState } from '../../../shared/update'

interface Props {
  state: UpdateState
  /** Guarda el documento actual si hace falta; devuelve false si no se pudo. */
  saveBeforeRestart: () => Promise<boolean>
}

function keyOf(s: UpdateState): string {
  return `${s.status}:${'version' in s ? s.version : ''}`
}

/** Franja discreta arriba del documento. Nunca es modal ni roba el foco. */
export function UpdateBanner({ state, saveBeforeRestart }: Props): React.JSX.Element | null {
  const [dismissed, setDismissed] = useState<string | null>(null)
  // La nota se asocia a un estado concreto; al cambiar de estado deja de mostrarse sola.
  const [noteFor, setNoteFor] = useState<{ key: string; text: string } | null>(null)

  // Mensajes de confirmación de una revisión manual se ocultan solos.
  useEffect(() => {
    if (state.status !== 'up-to-date' || !state.manual) return
    const t = setTimeout(() => setDismissed(keyOf(state)), 5000)
    return () => clearTimeout(t)
  }, [state])

  if (dismissed === keyOf(state)) return null
  const close = (): void => setDismissed(keyOf(state))
  const note = noteFor && noteFor.key === keyOf(state) ? noteFor.text : null
  const setNote = (text: string): void => setNoteFor({ key: keyOf(state), text })

  let body: React.JSX.Element | null = null
  switch (state.status) {
    case 'checking':
      if (!state.manual) return null
      body = <span>Buscando actualizaciones…</span>
      break
    case 'up-to-date':
      if (!state.manual) return null
      body = <span>Tienes la versión más reciente de Lumen ({state.version}).</span>
      break
    case 'available':
      body = (
        <>
          <span>
            <strong>Lumen {state.version}</strong> está disponible.
          </span>
          <button type="button" onClick={() => window.lumen.openReleasePage(state.notesUrl)}>
            Ver novedades
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => void window.lumen.downloadUpdate()}
          >
            {state.canAutoUpdate ? 'Descargar' : 'Ir a descargas'}
          </button>
          <button type="button" onClick={close}>
            Más tarde
          </button>
        </>
      )
      break
    case 'downloading':
      body = (
        <>
          <span>
            Descargando Lumen {state.version}… {state.percent}%
          </span>
          <span className="lumen-update-progress" aria-hidden>
            <span style={{ width: `${state.percent}%` }} />
          </span>
        </>
      )
      break
    case 'ready':
      body = (
        <>
          <span>
            <strong>Lumen {state.version}</strong> está lista para instalarse.
          </span>
          {note && <span className="lumen-update-note">{note}</span>}
          <button
            type="button"
            className="primary"
            onClick={() =>
              void (async () => {
                if (!(await saveBeforeRestart())) {
                  setNote('Guarda el documento antes de reiniciar.')
                  return
                }
                const res = await window.lumen.installUpdate()
                if (!res.ok && res.reason === 'dirty')
                  setNote('Hay otra ventana con cambios sin guardar.')
              })()
            }
          >
            Reiniciar ahora
          </button>
          <button type="button" onClick={close} title="Se instalará cuando cierres Lumen">
            Al cerrar Lumen
          </button>
        </>
      )
      break
    case 'error':
      if (!state.manual) return null
      body = (
        <>
          <span>{state.message}</span>
          <button type="button" onClick={() => window.lumen.openReleasePage()}>
            Abrir página de descargas
          </button>
          <button type="button" onClick={close}>
            Cerrar
          </button>
        </>
      )
      break
    default:
      return null
  }

  return (
    <div className={`lumen-update lumen-update-${state.status}`} role="status" aria-live="polite">
      {body}
    </div>
  )
}
