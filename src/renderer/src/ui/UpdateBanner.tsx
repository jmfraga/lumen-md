import { useEffect, useState } from 'react'
import type { UpdateErrorCode, UpdateState } from '../../../shared/update'
import type { MessageKey } from '../../../shared/i18n'
import { useI18n } from '../i18n'

interface Props {
  state: UpdateState
  /** Guarda el documento actual si hace falta; devuelve false si no se pudo. */
  saveBeforeRestart: () => Promise<boolean>
}

const ERROR_KEYS: Record<UpdateErrorCode, MessageKey> = {
  offline: 'update.errOffline',
  applications: 'update.errApplications',
  generic: 'update.errGeneric'
}

function keyOf(s: UpdateState): string {
  return `${s.status}:${'version' in s ? s.version : ''}`
}

/** Franja discreta arriba del documento. Nunca es modal ni roba el foco. */
export function UpdateBanner({ state, saveBeforeRestart }: Props): React.JSX.Element | null {
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState<string | null>(null)
  // La nota se asocia a un estado concreto; al cambiar de estado deja de mostrarse sola.
  const [noteFor, setNoteFor] = useState<{ key: string; note: MessageKey } | null>(null)

  // La confirmación de una revisión manual se oculta sola.
  useEffect(() => {
    if (state.status !== 'up-to-date' || !state.manual) return
    const timer = setTimeout(() => setDismissed(keyOf(state)), 5000)
    return () => clearTimeout(timer)
  }, [state])

  if (dismissed === keyOf(state)) return null
  const close = (): void => setDismissed(keyOf(state))
  const note = noteFor && noteFor.key === keyOf(state) ? noteFor.note : null
  const setNote = (n: MessageKey): void => setNoteFor({ key: keyOf(state), note: n })

  let body: React.JSX.Element | null = null
  switch (state.status) {
    case 'checking':
      if (!state.manual) return null
      body = <span>{t('update.checking')}</span>
      break
    case 'up-to-date':
      if (!state.manual) return null
      body = <span>{t('update.upToDate', { version: state.version })}</span>
      break
    case 'available':
      body = (
        <>
          <span>
            <strong>Lumen {state.version}</strong> {t('update.isAvailable')}
          </span>
          <button type="button" onClick={() => window.lumen.openReleasePage(state.notesUrl)}>
            {t('update.notes')}
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => void window.lumen.downloadUpdate()}
          >
            {state.canAutoUpdate ? t('update.download') : t('update.goToDownloads')}
          </button>
          <button type="button" onClick={close}>
            {t('update.later')}
          </button>
        </>
      )
      break
    case 'downloading':
      body = (
        <>
          <span>{t('update.downloading', { version: state.version, percent: state.percent })}</span>
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
            <strong>Lumen {state.version}</strong> {t('update.isReady')}
          </span>
          {note && <span className="lumen-update-note">{t(note)}</span>}
          <button
            type="button"
            className="primary"
            onClick={() =>
              void (async () => {
                if (!(await saveBeforeRestart())) {
                  setNote('update.saveFirst')
                  return
                }
                const res = await window.lumen.installUpdate()
                if (!res.ok && res.reason === 'dirty') setNote('update.otherDirty')
              })()
            }
          >
            {t('update.restart')}
          </button>
          <button type="button" onClick={close} title={t('update.onQuitTitle')}>
            {t('update.onQuit')}
          </button>
        </>
      )
      break
    case 'error':
      if (!state.manual) return null
      body = (
        <>
          <span>{t(ERROR_KEYS[state.code])}</span>
          <button type="button" onClick={() => window.lumen.openReleasePage()}>
            {t('update.openDownloads')}
          </button>
          <button type="button" onClick={close}>
            {t('update.close')}
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
