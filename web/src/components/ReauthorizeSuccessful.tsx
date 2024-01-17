import { useTranslation } from 'react-i18next'

export const ReauthorizeSuccessful = () => {
  const { t } = useTranslation()

  return (
    <div className="mt-10">
      <h2>{t('reauthorize.successful.viesti')}</h2>
    </div>
  )
}
