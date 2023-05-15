import { StateTag } from '../StateTag'
import { Icon } from '../Icon'
import { AssignmentIn } from '../../types'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dropdown } from '../Dropdown'
import { LANGUAGE_OPTIONS } from '../../koodistoUtils'
import { useState } from 'react'
import { ContentContent, ContentHeader, ContentIconRow } from './ContentCommon'

type PuhviAssignmentContentProps = {
  assignment: AssignmentIn
  contentType?: string
}

export const PuhviContent = ({ assignment, contentType }: PuhviAssignmentContentProps) => {
  const { t } = useTranslation()
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
      <div className="my-3 bg-gray-bg p-3">
        <ul>
          <li>
            <span className="pr-1 font-semibold">{t('assignment.tavoitetaso')}:</span>
            *CEFR*
          </li>
          <li>
            <span className="pr-1 font-semibold">{t('assignment.aihe')}:</span>
            *topic*
          </li>
          <li>
            <span className="pr-1 font-semibold">{t('assignment.laajaalainenosaaminen')}:</span>
            *laaja-alainen osaaminen*
          </li>
        </ul>

        <ContentIconRow />
      </div>
      <ContentContent language={language} contentFi={assignment.contentFi} contentSv={assignment.contentSv} />
    </div>
  )
}
