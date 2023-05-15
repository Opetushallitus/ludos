import { StateTag } from '../StateTag'
import { Icon } from '../Icon'
import { ContentTypesEng, SukoAssignmentIn } from '../../types'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getKoodiLabel, getKoodisLabel } from '../../koodistoUtils'
import { useContext, useState } from 'react'
import { KoodistoContext } from '../../KoodistoContext'
import { ContentContent, ContentHeader, ContentIconRow } from './ContentCommon'

type SukoAssignmentContentProps = {
  assignment: SukoAssignmentIn
  contentType?: string
}
export const SukoContent = ({ assignment, contentType }: SukoAssignmentContentProps) => {
  const { t } = useTranslation()
  const ctx = useContext(KoodistoContext)
  const [language, setLanguage] = useState<string>('fi')
  const navigate = useNavigate()

  return (
    <div className="col min-h-[60vh] w-full">
      <ContentHeader
        language={language}
        nameFi={assignment.nameFi}
        nameSv={assignment.nameSv}
        onSelectedOptionsChange={(opt: string) => setLanguage(opt)}
      />
      <div className="row">
        <StateTag state={assignment.publishState} />
        <span
          className="row ml-3 gap-1 hover:cursor-pointer hover:underline"
          onClick={() =>
            navigate(`../${contentType}/update`, {
              state: {
                assignment
              }
            })
          }>
          <Icon name="muokkaa" color="text-green-primary" />
          <p className="text-green-primary">{t('assignment.muokkaa')}</p>
        </span>
      </div>
      <div className="my-3 bg-gray-bg px-3 pb-3 pt-2">
        {contentType !== ContentTypesEng.OHJEET && (
          <ul>
            <li>
              <span className="pr-1 font-semibold">{t('assignment.tehtavatyyppi')}:</span>{' '}
              {getKoodiLabel(assignment.assignmentTypeKoodiArvo, ctx.koodistos.tehtavatyyppisuko)}
            </li>
            <li>
              <span className="pr-1 font-semibold">{t('assignment.tavoitetaso')}:</span>
              {getKoodiLabel(assignment.tavoitetasoKoodiArvo, ctx.koodistos.taitotaso)}
            </li>
            <li>
              <span className="pr-1 font-semibold">{t('assignment.aihe')}:</span>
              *topic*
            </li>
            <li>
              <span className="pr-1 font-semibold">{t('assignment.laajaalainenosaaminen')}:</span>
              {getKoodisLabel(assignment.laajaalainenOsaaminenKoodiArvo, ctx.koodistos.laajaalainenosaaminenlops2021)}
            </li>
          </ul>
        )}

        <ContentIconRow />
      </div>
      <ContentContent language={language} contentFi={assignment.contentFi} contentSv={assignment.contentSv} />
    </div>
  )
}
