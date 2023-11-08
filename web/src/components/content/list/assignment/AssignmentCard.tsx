import { Icon } from '../../../Icon'
import { AssignmentOut, ContentType, Exam, TeachingLanguage } from '../../../../types'
import { StateTag } from '../../../StateTag'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../../../InternalLink'
import { isLdAssignment, isPuhviAssignment, isSukoAssignment } from '../../../../utils/assignmentUtils'
import { toLocaleDate } from '../../../../utils/formatUtils'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { useEffect, useState } from 'react'
import { AssignmentCardContentActions } from './AssignmentCardContentActions'
import { useToggleFavorite } from '../../../../hooks/useToggleFavorite'
import { contentPagePath, editingFormPath } from '../../../LudosRoutes'

type AssignmentCardProps = {
  teachingLanguage: TeachingLanguage
  assignment: AssignmentOut
  exam: Exam
  isFavoritePage?: boolean
  refreshData?: () => void
}

export const AssignmentCard = ({
  teachingLanguage,
  assignment,
  exam,
  isFavoritePage,
  refreshData
}: AssignmentCardProps) => {
  const { t } = useTranslation()
  const { getKoodisLabel, getKoodiLabel, getOppimaaraLabel } = useKoodisto()
  const { isYllapitaja } = useUserDetails()
  const [isFavorite, setIsFavorite] = useState(false)

  const { toggleFavorite } = useToggleFavorite({
    exam,
    assignmentId: assignment.id,
    isFavorite,
    setIsFavorite,
    isFavoritePage,
    refreshData
  })

  useEffect(() => setIsFavorite(assignment.isFavorite), [assignment.isFavorite])

  const isSuko = isSukoAssignment(assignment)
  const isPuhvi = isPuhviAssignment(assignment)
  const isLd = isLdAssignment(assignment)

  const returnLocation = `${location.pathname}${location.search}${location.hash}`

  return (
    <li
      className="my-2 rounded-lg border-2 border-gray-light"
      data-testid={`assignment-list-item-${assignment.id.toString()}`}>
      <div className="flex w-full flex-wrap items-center gap-3 pl-2 pt-2">
        <InternalLink
          className="text-lg font-semibold text-green-primary"
          to={contentPagePath(exam, ContentType.koetehtavat, assignment.id)}
          state={{ returnLocation }}
          data-testid="assignment-name-link">
          {(teachingLanguage === TeachingLanguage.fi ? assignment.nameFi : assignment.nameSv) || t('form.nimeton')}
        </InternalLink>
        {isYllapitaja && (
          <>
            <StateTag state={assignment.publishState} />
            <InternalLink
              to={editingFormPath(exam, ContentType.koetehtavat, assignment.id)}
              state={{ returnLocation }}
              data-testid={`assignment-${assignment.id.toString()}-edit`}>
              <Icon name="muokkaa" color="text-green-primary" />
            </InternalLink>
          </>
        )}
      </div>
      <div className="flex flex-wrap">
        <div className="flex w-full flex-col flex-wrap p-3 md:flex md:w-8/12 md:flex-row md:flex-nowrap md:items-center md:gap-10">
          {(isLd || isPuhvi) && (
            <>
              <div>
                <p className="text-xs text-gray-secondary">{t('assignment.lukuvuosi')}</p>
                <p className="text-xs text-black">{getKoodisLabel(assignment.lukuvuosiKoodiArvos, 'ludoslukuvuosi')}</p>
              </div>
              {isLd && (
                <div>
                  <p className="text-xs text-gray-secondary">{t('assignment.aine')}</p>
                  <p className="text-xs text-black">
                    {getKoodiLabel(assignment.aineKoodiArvo, 'ludoslukiodiplomiaine')}
                  </p>
                </div>
              )}
              {isPuhvi && (
                <div>
                  <p className="text-xs text-gray-secondary">{t('assignment.tehtavatyyppi')}</p>
                  <p className="text-xs text-black">
                    {getKoodiLabel(assignment.assignmentTypeKoodiArvo, 'tehtavatyyppipuhvi')}
                  </p>
                </div>
              )}
            </>
          )}
          {isSuko && (
            <>
              <div>
                <p className="text-xs text-gray-secondary">{t('assignment.oppimaara')}</p>
                <p className="text-xs text-black" data-testid="suko-oppimaara">
                  {getOppimaaraLabel(assignment.oppimaara)}
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
              {/*<div>*/}
              {/*  <p className="text-xs text-gray-secondary">{t('assignment.tavoitetaso')}</p>*/}
              {/*  <p className="text-xs text-black">{getKoodiLabel(assignment.tavoitetasoKoodiArvo, 'taitotaso')}</p>*/}
              {/*</div>*/}
            </>
          )}
          <div>
            <p className="text-xs text-gray-secondary">{t('assignment.lisatty')}</p>
            <p className="text-xs text-black">{toLocaleDate(assignment.createdAt)}</p>
          </div>
        </div>
        <AssignmentCardContentActions
          contentId={assignment.id}
          exam={exam}
          isFavorite={isFavorite}
          onClickHandler={toggleFavorite}
        />
      </div>
    </li>
  )
}
