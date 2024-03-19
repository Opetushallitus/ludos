import { useLudosTranslation } from '../../hooks/useLudosTranslation'

export const PresentationHeader = () => {
  const { t } = useLudosTranslation()

  return (
    <div className="flex justify-center bg-gray-bg pb-6">
      <div className="row w-[80vw] justify-between pt-3">
        <h1>{t('title.ludos')}</h1>
      </div>
    </div>
  )
}
