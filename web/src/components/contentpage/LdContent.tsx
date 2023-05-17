import { StateTag } from '../StateTag'
import { Icon } from '../Icon'
import { LdAssignmentIn } from '../../types'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { ContentContent, ContentHeader, ContentIconRow } from './ContentCommon'
import { useKoodisto } from '../../hooks/useKoodisto'

type LdAssignmentContentProps = {
  assignment: LdAssignmentIn
  contentType?: string
}

export const LdContent = ({ assignment, contentType }: LdAssignmentContentProps) => {
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
      <div className="my-3 bg-gray-bg p-3">
        <ul>
          <li>
            <span className="pr-1 font-semibold">{t('assignment.lukuvuosi')}:</span>
            {getKoodisLabel(assignment.lukuvuosiKoodiArvos, 'ludoslukuvuosi')}
          </li>
          <li>
            <span className="pr-1 font-semibold">{t('assignment.aine')}:</span>
            {getKoodiLabel(assignment.aineKoodiArvo, 'ludoslukiodiplomiaine')}
          </li>
          <li>
            <span className="pr-1 font-semibold">{t('assignment.laajaalainenosaaminen')}:</span>
            {getKoodisLabel(assignment.laajaalainenOsaaminenKoodiArvos, 'laajaalainenosaaminenlops2021')}
          </li>
        </ul>

        <ContentIconRow />
      </div>
      <ContentContent language={language} contentFi={assignment.contentFi} contentSv={assignment.contentSv} />
    </div>
  )
}
