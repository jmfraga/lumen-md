import type { ViewMode } from '../state/document'
import type { Message } from '../../../shared/i18n'
import { useI18n } from '../i18n'

interface Props {
  path: string | null
  autosave: boolean
  dirty: boolean
  status: Message | null
  mode: ViewMode
  text: string
}

function countWords(text: string): number {
  const m = text.replace(/```[\s\S]*?```/g, ' ').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)
  return m ? m.length : 0
}

export function StatusBar(p: Props): React.JSX.Element {
  const { t } = useI18n()
  const n = countWords(p.text)
  return (
    <footer className="lumen-statusbar">
      <span className="lumen-status-path" title={p.path ?? ''}>
        {p.path ?? t('status.newDoc')}
      </span>
      <span className="lumen-status-right">
        {p.status && <span className="lumen-status-msg">{t(p.status.key, p.status.vars)}</span>}
        <span>{t(n === 1 ? 'status.word' : 'status.words', { n })}</span>
        <span>{p.mode === 'source' ? t('status.modeSource') : t('status.modeWysiwyg')}</span>
        <button
          type="button"
          className="lumen-status-feedback"
          onClick={() => window.lumen.openFeedback('mejora')}
          title={t('status.suggestTitle')}
        >
          {t('status.suggest')}
        </button>
        <span title={t('status.autosaveTitle')}>
          {p.autosave ? t('status.autosaveOn') : p.dirty ? t('status.unsaved') : t('status.manual')}
        </span>
      </span>
    </footer>
  )
}
