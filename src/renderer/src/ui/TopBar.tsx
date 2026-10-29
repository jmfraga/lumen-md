import type { ViewMode } from '../state/document'
import { InsertMenu } from './InsertMenu'
import type { InsertKind } from '../editor/insert'
import { useI18n } from '../i18n'
import { shortcut } from '../../../shared/i18n'

interface Props {
  name: string
  dirty: boolean
  mode: ViewMode
  onToggleSource: () => void
  onOpen: () => void
  onSave: () => void
  onExportHtml: () => void
  onExportPdf: () => void
  onInsert: (kind: InsertKind) => void
  onInsertTable: (rows: number, cols: number) => void
}

export function TopBar(p: Props): React.JSX.Element {
  const { t, platform } = useI18n()
  const sc = (key: string): string => shortcut(platform, key)
  return (
    <header className="lumen-topbar">
      <div className="lumen-topbar-title" title={p.name}>
        {p.dirty ? '• ' : ''}
        {p.name}
      </div>
      <div className="lumen-topbar-actions">
        <InsertMenu
          disabled={p.mode !== 'wysiwyg'}
          onInsert={p.onInsert}
          onInsertTable={p.onInsertTable}
        />
        <span className="lumen-sep" />
        <button
          type="button"
          onClick={p.onOpen}
          title={t('topbar.openTitle', { shortcut: sc('O') })}
        >
          {t('topbar.open')}
        </button>
        <button
          type="button"
          onClick={p.onSave}
          title={t('topbar.saveTitle', { shortcut: sc('S') })}
        >
          {t('topbar.save')}
        </button>
        <span className="lumen-sep" />
        <button type="button" onClick={p.onExportHtml} title={t('topbar.exportHtmlTitle')}>
          HTML
        </button>
        <button
          type="button"
          onClick={p.onExportPdf}
          title={t('topbar.exportPdfTitle', { shortcut: sc('P') })}
        >
          PDF
        </button>
        <span className="lumen-sep" />
        <button
          type="button"
          className={p.mode === 'source' ? 'active' : ''}
          onClick={p.onToggleSource}
          title={t('topbar.toggleTitle', { shortcut: sc('/') })}
        >
          {p.mode === 'source' ? t('topbar.preview') : t('topbar.source')}
        </button>
      </div>
    </header>
  )
}
