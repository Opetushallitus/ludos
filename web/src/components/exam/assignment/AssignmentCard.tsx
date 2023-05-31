import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../Icon'
import { AssignmentIn, Exam } from '../../../types'
import { StateTag } from '../../StateTag'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../../InternalLink'
import { isLdAssignment, isPuhviAssignment, isSukoAssignment } from './assignmentUtils'
import { toLocaleDate } from '../../../formatUtils'
import { ContentActions } from './ContentActions'
import { useKoodisto } from '../../../hooks/useKoodisto'

type AssignmentCardProps = {
  language: string
  assignment: AssignmentIn
  exam: Exam
}

export const AssignmentCard = ({ language, assignment, exam }: AssignmentCardProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { getKoodisLabel, getKoodiLabel } = useKoodisto()

  const isSuko = isSukoAssignment(assignment, exam)
  const isPuhvi = isPuhviAssignment(assignment, exam)
  const isLd = isLdAssignment(assignment, exam)

  return (
    <li
      className="my-2 rounded-lg border-2 border-gray-light"
      data-testid={`assignment-list-item-${assignment.id.toString()}`}>
      <div className="flex w-full flex-wrap items-center gap-3 pl-2 pt-2">
        <InternalLink
          className="text-lg font-semibold text-green-primary"
          to={`${assignment.id}`}
          state={{
            searchValuesString: location.search
          }}>
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
      <div className="flex flex-wrap md:flex md:flex-row md:flex-wrap">
        <div className="flex w-full flex-col flex-wrap p-3 md:flex md:w-8/12 md:flex-row md:flex-nowrap md:items-center md:gap-10">
          {(isLd || isPuhvi) && (
            <>
              <div>
                <p className="text-xs text-gray-secondary">{t('assignment.lukuvuosi')}</p>
                <p className="text-xs text-black">
                  {getKoodisLabel(assignment.lukuvuosiKoodiArvos, 'ludoslukuvuosi') || '*'}
                </p>
              </div>
              {isLd && (
                <div>
                  <p className="text-xs text-gray-secondary">{t('assignment.aine')}</p>
                  <p className="text-xs text-black">
                    {getKoodiLabel(assignment.aineKoodiArvo, 'ludoslukiodiplomiaine') || '*'}
                  </p>
                </div>
              )}
              {isPuhvi && (
                <div>
                  <p className="text-xs text-gray-secondary">{t('assignment.aine')}</p>
                  <p className="text-xs text-black">
                    {getKoodiLabel(assignment.assignmentTypeKoodiArvo, 'tehtavatyyppipuhvi') || '*'}
                  </p>
                </div>
              )}
            </>
          )}
          {isSuko && (
            <>
              <div>
                <p className="text-xs text-gray-secondary">{t('assignment.oppimaara')}</p>
                <p className="text-xs text-black">
                  {getKoodiLabel(assignment.oppimaaraKoodiArvo, 'oppiaineetjaoppimaaratlops2021') || '*'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-secondary">{t('assignment.tyyppi')}</p>
                <p className="text-xs text-black">
                  {getKoodiLabel(assignment.assignmentTypeKoodiArvo, 'tehtavatyyppisuko')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-secondary">{t('assignment.aihe')}</p>
                <p className="text-xs text-black">{getKoodisLabel(assignment.aiheKoodiArvos, 'aihesuko')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-secondary">{t('assignment.tavoitetaso')}</p>
                <p className="text-xs text-black">{getKoodiLabel(assignment.tavoitetasoKoodiArvo, 'taitotaso')}</p>
              </div>
            </>
          )}
          <div>
            <p className="text-xs text-gray-secondary">{t('assignment.lisatty')}</p>
            <p className="text-xs text-black">{toLocaleDate(assignment.createdAt)}</p>
          </div>
        </div>
        <ContentActions />
      </div>
    </li>
  )
}
