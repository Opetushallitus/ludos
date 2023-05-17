import { Icon } from '../../Icon'
import { useTranslation } from 'react-i18next'

export const ContentActions = () => {
  const { t } = useTranslation()

  return (
    <div className="flex w-full flex-wrap items-center justify-evenly md:w-4/12 md:justify-end">
      <span className="flex items-center pr-3">
        <Icon name="uusi-valilehti" color="text-green-primary" />
        <p className="ml-1 text-xs text-green-primary">{t('assignment.katselunakyma')}</p>
      </span>
      <span className="flex items-center pr-3">
        <Icon name="koetehtavat" color="text-green-primary" />
        <p className="ml-1 text-xs text-green-primary">{t('assignment.lataapdf')}</p>
      </span>
      <span className="flex items-center pr-3">
        <Icon name="lisää" color="text-green-primary" />
        <p className="ml-1 text-xs text-green-primary">{t('assignment.lisaalatauskoriin')}</p>
      </span>
    </div>
  )
}
