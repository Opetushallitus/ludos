import { ContentFormAction, ContentType, ContentTypeSingular } from '../../../types'
import { useTranslation } from 'react-i18next'

export const FormHeader = ({
  action,
  contentType,
  name
}: {
  action: ContentFormAction
  contentType: ContentType
  name?: string
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-6">
      <h2 className="mb-3" data-testid="heading">
        {action === ContentFormAction.uusi ? t(`form.otsikko${ContentTypeSingular[contentType]}`) : name}
      </h2>
      {action === ContentFormAction.uusi ? (
        <p>{t(`form.kuvaus${ContentTypeSingular[contentType]}`)}</p>
      ) : (
        <p>{t('form.muokkauskuvaus')}</p>
      )}
    </div>
  )
}
