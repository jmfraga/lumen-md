import { useI18n } from '../i18n'

export function DropOverlay(): React.JSX.Element {
  const { t } = useI18n()
  return (
    <div className="lumen-drop">
      <div>{t('drop.hint')}</div>
    </div>
  )
}
