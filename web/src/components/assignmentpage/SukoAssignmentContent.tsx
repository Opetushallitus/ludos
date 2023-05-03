import { StateTag } from '../StateTag'
import { Icon } from '../Icon'
import { ExamTypesEng, SukoAssignmentIn } from '../../types'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Dropdown } from '../Dropdown'
import { LANGUAGE_OPTIONS } from '../../koodisto'
import { useState } from 'react'

type SukoAssignmentContentProps = {
  assignment: SukoAssignmentIn
  examType?: string
}

export const SukoAssignmentContent = ({ assignment, examType }: SukoAssignmentContentProps) => {
  const { t } = useTranslation()
  const [language, setLanguage] = useState<string>('fi')
  const navigate = useNavigate()

  return (
    <div className="col min-h-[60vh] w-full">
      <div className="row justify-between">
        <h2 className="pb-3" data-testid="assignment-header">
          {language === 'fi' ? assignment.nameFi : assignment.nameSv}
        </h2>
        <div>
          <p className="pl-2">{t('filter.kieli')}</p>
          <Dropdown
            currentOption={LANGUAGE_OPTIONS.find((opt) => opt.key === language)?.value || null}
            onOptionClick={(opt: string) => setLanguage(opt)}
            options={LANGUAGE_OPTIONS}
          />
        </div>
      </div>
      <div className="row">
        <StateTag state={assignment.state} />
        <span
          className="row ml-3 gap-1 hover:cursor-pointer hover:underline"
          onClick={() =>
            navigate(`../${examType}/update`, {
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
        {examType !== ExamTypesEng.OHJEET && (
          <ul>
            <li>
              <span className="pr-1 font-semibold">Tehtävätyyppi:</span> {assignment.assignmentType.toLowerCase()}
            </li>
            <li>
              <span className="pr-1 font-semibold">Tavoitetaitotaso:</span>
              *CEFR*
            </li>
            <li>
              <span className="pr-1 font-semibold">Aihe:</span>
              *topic*
            </li>
            <li>
              <span className="pr-1 font-semibold">Laaja-alainen osaaminen:</span>
              *laaja-alainen osaaminen*
            </li>
          </ul>
        )}

        <div className="mt-3 flex gap-3">
          <div className="flex gap-1">
            <Icon name="uusi-valilehti" color="text-green-primary" />
            <p className="text-green-primary">Katselunäkymä</p>
          </div>
          <div className="flex gap-1">
            <Icon name="todistukset" color="text-green-primary" />
            <p className="text-green-primary">Lataa pdf</p>
          </div>
          <div className="flex gap-1">
            <Icon name="lisää" color="text-green-primary" />
            <p className="text-green-primary">Lisää latauskoriin</p>
          </div>
        </div>
      </div>
      <p className="h-full pb-3">{language === 'fi' ? assignment.contentFi : assignment.contentSv}</p>
    </div>
  )
}
