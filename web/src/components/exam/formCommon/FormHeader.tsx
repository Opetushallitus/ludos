import { ContentTypeTranslationFinnish } from '../assignment/assignmentUtils'
import { ContentTypeEng, ContentTypeKeys, ContentTypesSingular } from '../../../types'
import { useTranslation } from 'react-i18next'

export const FormHeader = ({
  action,
  contentType,
  name
}: {
  action: 'new' | 'update'
  contentType: ContentTypeEng
  name?: string
}) => {
  const { t } = useTranslation()

  const contentTypeFin = ContentTypeTranslationFinnish[contentType].toUpperCase() as ContentTypeKeys

  const contentTypeTextVariable = ContentTypesSingular[contentTypeFin]

  return (
    <div className="mb-6">
      <h2 className="mb-3" data-testid="heading">
        {action === 'new' ? t(`form.otsikko${contentTypeTextVariable}`) : name}
      </h2>
      {action === 'new' ? <p>{t(`form.kuvaus${contentTypeTextVariable}`)}</p> : <p>{t('form.muokkauskuvaus')}</p>}
    </div>
  )
}
