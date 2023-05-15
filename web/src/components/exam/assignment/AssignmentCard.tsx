import { useNavigate } from 'react-router-dom'
import { Icon } from '../../Icon'
import { AssignmentIn, Exam } from '../../../types'
import { StateTag } from '../../StateTag'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../../InternalLink'
import { isSukoAssignment } from './assignmentUtils'
import { toLocaleDate } from '../../../formatUtils'
import { KoodistoContext } from '../../../KoodistoContext'
import { useContext } from 'react'
import { getAssignmentTypeName } from '../../../koodistoUtils'

type AssignmentCardProps = {
  language: string
  assignment: AssignmentIn
  exam: Exam
}

export const AssignmentCard = ({ language, assignment, exam }: AssignmentCardProps) => {
  const { t } = useTranslation()
  const ctx = useContext(KoodistoContext)
  const navigate = useNavigate()

  return (
    <li className="my-2 rounded-lg border-2 border-gray-light" data-testid={`assignment-${assignment.id.toString()}`}>
      <div className="flex w-full flex-wrap items-center gap-3 pl-2 pt-2">
        <InternalLink className="text-lg font-semibold text-green-primary" to={`${assignment.id}`}>
          {language === 'fi' ? assignment.nameFi : assignment.nameSv}
        </InternalLink>
        <StateTag state={assignment.publishState} />
        <Icon
          name="muokkaa"
          color="text-green-primary"
          dataTestId={`assignment-${assignment.id.toString()}-edit`}
          onClick={() =>
            navigate('update', {
              state: {
                assignment
              }
            })
          }
        />
      </div>
      <div className="flex flex-wrap md:flex md:flex-row md:flex-nowrap">
        <div className="flex w-full flex-col flex-wrap p-3 md:flex md:w-6/12 md:flex-row md:flex-nowrap md:items-center md:gap-10">
          <div>
            <p className="text-xs text-gray-secondary">{t('assignment.oppimaara')}</p>
            <p className="text-xs text-black">*oppimäärä*</p>
          </div>
          <div>
            <p className="text-xs text-gray-secondary">{t('assignment.tyyppi')}</p>
            <p className="text-xs text-black">
              {isSukoAssignment(assignment, exam)
                ? getAssignmentTypeName(assignment, ctx.koodistos.tehtavatyyppisuko)
                : '*'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-secondary">{t('assignment.lisatty')}</p>
            <p className="text-xs text-black">{toLocaleDate(assignment.createdAt)}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-evenly md:w-6/12 md:justify-end md:gap-3 md:p-3">
          <span className="flex items-center">
            <Icon name="uusi-valilehti" color="text-green-primary" />
            <p className="ml-1 text-xs text-green-primary">{t('assignment.katselunakyma')}</p>
          </span>
          <span className="flex items-center">
            <Icon name="koetehtavat" color="text-green-primary" />
            <p className="ml-1 text-xs text-green-primary">{t('assignment.lataapdf')}</p>
          </span>
          <span className="flex items-center">
            <Icon name="lisää" color="text-green-primary" />
            <p className="ml-1 text-xs text-green-primary">{t('assignment.lisaalatauskoriin')}</p>
          </span>
        </div>
      </div>
    </li>
  )
}
