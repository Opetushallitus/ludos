import { useNavigate } from 'react-router-dom'
import { Icon } from '../../Icon'
import { AssignmentIn } from '../../../types'
import { StateTag } from '../../StateTag'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../../InternalLink'
import { isSukoAssignment } from './assignmentUtils'
import { toLocaleDate } from '../../../formatUtils'

type AssignmentCardProps = {
  assignment: AssignmentIn
  exam: string
}

export const AssignmentCard = ({ assignment, exam }: AssignmentCardProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <li className="my-2 rounded-lg border-2 border-gray-light" data-testid={`assignment-${assignment.id.toString()}`}>
      <div className="flex w-full flex-wrap items-center gap-3 pl-2 pt-2">
        <InternalLink className="text-lg font-semibold text-green-primary" to={`${assignment.id}`}>
          {assignment.name}
        </InternalLink>
        <StateTag state={assignment.state} />
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
            <p className="text-sm text-gray-secondary">{t('assignment.oppimaara')}</p>
            <p className="text-sm text-black">*oppimäärä*</p>
          </div>
          <div>
            <p className="text-sm text-gray-secondary">{t('assignment.tyyppi')}</p>
            <p className="text-sm capitalize text-black">
              {isSukoAssignment(assignment, exam) ? assignment.assignmentType.toLowerCase() : '*'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-secondary">{t('assignment.lisatty')}</p>
            <p className="text-sm text-black">{new Date(assignment.createdAt).toLocaleDateString('fi-FI')}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-evenly md:w-6/12 md:justify-end md:gap-3 md:p-3">
          <span className="flex items-center">
            <Icon name="uusi-valilehti" color="text-green-primary" />
            <p className="ml-1 text-sm text-green-primary">{t('assignment.katselunakyma')}</p>
          </span>
          <span className="flex items-center">
            <Icon name="koetehtavat" color="text-green-primary" />
            <p className="ml-1 text-sm text-green-primary">{t('assignment.lataapdf')}</p>
          </span>
          <span className="flex items-center">
            <Icon name="lisää" color="text-green-primary" />
            <p className="ml-1 text-sm text-green-primary">{t('assignment.lisaalatauskoriin')}</p>
          </span>
        </div>
      </div>
    </li>
  )
}
