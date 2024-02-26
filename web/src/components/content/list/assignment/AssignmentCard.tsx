import { Icon } from '../../../Icon'
import {
  AssignmentCardOut,
  ContentType,
  FavoriteIdsDtoOut,
  isLdAssignment,
  isPuhviAssignment,
  isSukoAssignment,
  TeachingLanguage
} from '../../../../types'
import { StateTag } from '../../../StateTag'
import { useTranslation } from 'react-i18next'
import { InternalLink } from '../../../InternalLink'
import { toLocaleDate } from '../../../../utils/formatUtils'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import { useState } from 'react'
import { useSetFavoriteFolders } from '../../../../hooks/useSetFavoriteFolders'
import { contentPagePath, editingFormPath } from '../../../LudosRoutes'
import { AssignmentCardContentActions } from './AssignmentCardContentActions'
import { SetFavoriteFoldersModal } from '../../../modal/favoriteModal/SetFavoriteFoldersModal'

type AssignmentCardProps = {
  teachingLanguage: TeachingLanguage
  assignmentCard: AssignmentCardOut
  favoriteIds: FavoriteIdsDtoOut | undefined
  favoriteIdsRefresh?: () => void
}

export const AssignmentCard = ({
  teachingLanguage,
  assignmentCard,
  favoriteIds,
  favoriteIdsRefresh
}: AssignmentCardProps) => {
  const { t } = useTranslation()
  const { getKoodisLabel, getKoodiLabel, getOppimaaraLabel } = useKoodisto(teachingLanguage)
  const { isYllapitaja } = useUserDetails()
  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false)

  const { setFavoriteFolders } = useSetFavoriteFolders({
    refreshData: favoriteIdsRefresh
  })

  const isFavorite = (favoriteIds && !!favoriteIds?.folderIdsByAssignmentId[assignmentCard.id]) || false

  const returnLocation = `${location.pathname}${location.search}${location.hash}`

  return (
    <>
      <li
        className="my-2 rounded-lg border-2 border-gray-light"
        data-testid={`assignment-list-item-${assignmentCard.id.toString()}`}>
        <div className="flex w-full flex-wrap items-center gap-3 pl-2 pt-2">
          <InternalLink
            className="text-lg font-semibold text-green-primary"
            to={contentPagePath(assignmentCard.exam, ContentType.ASSIGNMENT, assignmentCard.id)}
            state={{ returnLocation }}
            data-testid="card-title">
            {(teachingLanguage === TeachingLanguage.fi ? assignmentCard.nameFi : assignmentCard.nameSv) ||
              t('form.nimeton')}
          </InternalLink>
          {isYllapitaja && (
            <>
              <StateTag state={assignmentCard.publishState} />
              <InternalLink
                to={editingFormPath(assignmentCard.exam, ContentType.ASSIGNMENT, assignmentCard.id)}
                state={{ returnLocation }}
                data-testid={`assignment-${assignmentCard.id.toString()}-edit`}>
                <Icon name="muokkaa" color="text-green-primary" />
              </InternalLink>
            </>
          )}
        </div>
        <div className="flex flex-wrap">
          <div className="flex w-full flex-col flex-wrap p-3 md:flex md:w-8/12 md:flex-row md:flex-nowrap md:items-center md:gap-10">
            {(isLdAssignment(assignmentCard) || isPuhviAssignment(assignmentCard)) && (
              <>
                <div>
                  <p className="text-xs text-gray-secondary">{t('assignment.lukuvuosi')}</p>
                  <p className="text-xs text-black">
                    {getKoodisLabel(assignmentCard.lukuvuosiKoodiArvos, 'ludoslukuvuosi')}
                  </p>
                </div>
                {isLdAssignment(assignmentCard) && (
                  <div>
                    <p className="text-xs text-gray-secondary">{t('assignment.aine')}</p>
                    <p className="text-xs text-black">
                      {getKoodiLabel(assignmentCard.aineKoodiArvo, 'ludoslukiodiplomiaine')}
                    </p>
                  </div>
                )}
                {isPuhviAssignment(assignmentCard) && (
                  <div>
                    <p className="text-xs text-gray-secondary">{t('assignment.tehtavatyyppi')}</p>
                    <p className="text-xs text-black">
                      {getKoodiLabel(assignmentCard.assignmentTypeKoodiArvo, 'tehtavatyyppipuhvi')}
                    </p>
                  </div>
                )}
              </>
            )}
            {isSukoAssignment(assignmentCard) && (
              <>
                <div>
                  <p className="text-xs text-gray-secondary">{t('assignment.oppimaara')}</p>
                  <p className="text-xs text-black" data-testid="suko-oppimaara">
                    {getOppimaaraLabel(assignmentCard.oppimaara)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-secondary">{t('assignment.tyyppi')}</p>
                  <p className="text-xs text-black">
                    {getKoodiLabel(assignmentCard.assignmentTypeKoodiArvo, 'tehtavatyyppisuko')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-secondary">{t('assignment.aihe')}</p>
                  <p className="text-xs text-black">{getKoodisLabel(assignmentCard.aiheKoodiArvos, 'aihesuko')}</p>
                </div>
                {/*<div>*/}
                {/*  <p className="text-xs text-gray-secondary">{t('assignment.tavoitetaso')}</p>*/}
                {/*  <p className="text-xs text-black">{getKoodiLabel(assignment.tavoitetasoKoodiArvo, 'taitotaso')}</p>*/}
                {/*</div>*/}
              </>
            )}
            <div>
              <p className="text-xs text-gray-secondary">{t('assignment.lisatty')}</p>
              <p className="text-xs text-black">{toLocaleDate(assignmentCard.createdAt)}</p>
            </div>
          </div>
          <AssignmentCardContentActions
            assignment={assignmentCard}
            isFavorite={isFavorite}
            onFavoriteClick={() => setIsFavoriteModalOpen(true)}
            language={teachingLanguage}
            isFavoriteButtonDisabled={!favoriteIds}
          />
        </div>
      </li>

      {isFavoriteModalOpen && favoriteIds && (
        <SetFavoriteFoldersModal
          isFavorite={isFavorite}
          assignmentCard={assignmentCard}
          favoriteIds={favoriteIds}
          assignmentName={
            (teachingLanguage === TeachingLanguage.fi ? assignmentCard.nameFi : assignmentCard.nameSv) ||
            t('form.nimeton')
          }
          onClose={() => setIsFavoriteModalOpen(false)}
          onSetFavoriteFoldersAction={async (data) => {
            await setFavoriteFolders(data)
            setIsFavoriteModalOpen(false)
          }}
        />
      )}
    </>
  )
}
