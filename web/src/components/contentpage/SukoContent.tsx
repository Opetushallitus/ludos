import { StateTag } from '../StateTag'
import { Icon } from '../Icon'
import { ContentTypeEng, SukoAssignmentIn } from '../../types'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { ContentContent, ContentHeader, ContentIconRow, ContentInstruction } from './ContentCommon'
import { useKoodisto } from '../../hooks/useKoodisto'

type SukoAssignmentContentProps = {
  assignment: SukoAssignmentIn
  contentType?: string
}
export const SukoContent = ({ assignment, contentType }: SukoAssignmentContentProps) => {
  const { t } = useTranslation()
  const [language, setLanguage] = useState<string>('fi')
  const navigate = useNavigate()
  const { getKoodisLabel, getKoodiLabel } = useKoodisto()

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
        {contentType !== ContentTypeEng.OHJEET && (
          <ul>
            <li>
              <span className="pr-1 font-semibold">{t('assignment.tehtavatyyppi')}:</span>{' '}
              {getKoodiLabel(assignment.assignmentTypeKoodiArvo, 'tehtavatyyppisuko')}
            </li>
            <li>
              <span className="pr-1 font-semibold">{t('assignment.tavoitetaso')}:</span>
              {getKoodiLabel(assignment.tavoitetasoKoodiArvo, 'taitotaso')}
            </li>
            <li>
              <span className="pr-1 font-semibold">{t('assignment.aihe')}:</span>
              {assignment.aiheKoodiArvos.length > 0 ? getKoodisLabel(assignment.aiheKoodiArvos, 'aihesuko') : '-'}
            </li>
            <li>
              <span className="pr-1 font-semibold">{t('assignment.laajaalainenosaaminen')}:</span>
              {assignment.laajaalainenOsaaminenKoodiArvos.length > 0
                ? getKoodisLabel(assignment.laajaalainenOsaaminenKoodiArvos, 'laajaalainenosaaminenlops2021')
                : '-'}
            </li>
          </ul>
        )}

        <ContentIconRow />
      </div>

      <ContentInstruction
        language={language}
        instructionFi={assignment.instructionFi}
        instructionSv={assignment.instructionSv}
      />

      <div className="mb-4 border-b border-gray-separator" />

      <ContentContent language={language} contentFi={assignment.contentFi} contentSv={assignment.contentSv} />
    </div>
  )
}
