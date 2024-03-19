import { useLudosTranslation } from '../hooks/useLudosTranslation'

export const ReauthorizeSuccessful = () => {
  const { t } = useLudosTranslation()

  return (
    <div className="mt-10">
      <h2>{t('reauthorize.successful.viesti')}</h2>
    </div>
  )
}
