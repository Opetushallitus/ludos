import { ContentTypeTranslationFinnish } from '../../assignmentUtils'
import { AssignmentIn, ContentTypeKeys, ContentTypeEng, ContentTypesSingular } from '../../../../../types'
import { useTranslation } from 'react-i18next'

export const FormHeader = ({
  action,
  assignment,
  contentType
}: {
  action: 'new' | 'update'
  contentType: ContentTypeEng
  assignment: AssignmentIn
}) => {
  const { t } = useTranslation()

  const contentTypeFin = ContentTypeTranslationFinnish[contentType].toUpperCase() as ContentTypeKeys

  const contentTypeTextVariable = ContentTypesSingular[contentTypeFin]

  return (
    <div className="mb-6">
      <h2 className="mb-3" data-testid="heading">
        {action === 'new' ? t(`form.otsikko${contentTypeTextVariable}`) : assignment?.nameFi}
      </h2>
      {action === 'new' ? <p>{t(`form.kuvaus${contentTypeTextVariable}`)}</p> : <p>{t('form.muokkauskuvaus')}</p>}
    </div>
  )
}
