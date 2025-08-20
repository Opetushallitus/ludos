import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useKoodisto } from '../../../../hooks/useKoodisto'
import { useLudosTranslation } from '../../../../hooks/useLudosTranslation'
import { useSetFavoriteFolders } from '../../../../hooks/useSetFavoriteFolders'
import { useUserDetails } from '../../../../hooks/useUserDetails'
import {
  AssignmentCardOut,
  ContentType,
  FavoriteAction,
  FavoriteIdsDtoOut,
  isLdAssignment,
  isPuhviAssignment,
  isSukoAssignment,
  Language
} from '../../../../types'
import { toLocaleDate } from '../../../../utils/formatUtils'
import { Icon } from '../../../Icon'
import { InternalLink } from '../../../InternalLink'
import { contentPagePath, editingFormPath, suosikitKey } from '../../../LudosRoutes'
import { FavoriteToggleModalFormType } from '../../../modal/favoriteModal/favoriteToggleModalFormSchema'
import { SetFavoriteFoldersModal } from '../../../modal/favoriteModal/SetFavoriteFoldersModal'
import { StateTag } from '../../../StateTag'
import { AssignmentCardContentActions } from './AssignmentCardContentActions'

type AssignmentCardProps = {
  teachingLanguage: Language
  assignmentCard: AssignmentCardOut
  favoriteIds: FavoriteIdsDtoOut | undefined
  refetchFavoriteIds: () => void
}

export const AssignmentCard = ({
  teachingLanguage,
  assignmentCard,
  favoriteIds,
  refetchFavoriteIds
}: AssignmentCardProps) => {
  const { t } = useLudosTranslation()
  const { getKoodisLabel, getKoodiLabel, getOppimaaraLabel } = useKoodisto()
  const { isYllapitaja } = useUserDetails()
  const [isFavoriteModalOpen, setIsFavoriteModalOpen] = useState(false)
  const location = useLocation()

  const isFavoritesPage = location.pathname.includes(suosikitKey)

  const { setFavoriteFolders, unFavorite } = useSetFavoriteFolders(refetchFavoriteIds)

  const isFavorite = (favoriteIds && !!favoriteIds?.folderIdsByAssignmentId[assignmentCard.id]) || false

  const returnLocation = `${location.pathname}${location.search}${location.hash}`

  const onSetFavoriteFoldersAction = async (data: FavoriteToggleModalFormType) => {
    await setFavoriteFolders({ data, favoriteAction: isFavorite ? FavoriteAction.EDIT : FavoriteAction.ADD })
    setIsFavoriteModalOpen(false)
  }

  const moveFolderAction = isFavoritesPage
    ? {
        onClick: () => setIsFavoriteModalOpen(true),
        hasFolders: Object.values(favoriteIds ? favoriteIds.rootFolder.subfolders : []).length > 0
      }
    : undefined

  return (
    <>
      <li
        className="my-2 rounded-lg border-2 border-gray-light"
        data-testid={`assignment-list-item-${assignmentCard.id.toString()}`}
      >
        <div className="flex w-full flex-wrap items-center gap-3 pl-2 pt-2">
          <InternalLink
            className="text-lg font-semibold text-green-primary"
            to={contentPagePath(assignmentCard.exam, ContentType.ASSIGNMENT, assignmentCard.id)}
            state={{ returnLocation }}
            data-testid="card-title"
          >
            {(teachingLanguage === Language.FI ? assignmentCard.nameFi : assignmentCard.nameSv) || t('form.nimeton')}
          </InternalLink>
          {isYllapitaja && (
            <>
              <StateTag state={assignmentCard.publishState} />
              <InternalLink
                to={editingFormPath(assignmentCard)}
                state={{ returnLocation }}
                data-testid={`assignment-${assignmentCard.id.toString()}-edit`}
              >
                <Icon name="muokkaa" color="text-green-primary" />
              </InternalLink>
            </>
          )}
        </div>
        <div className="flex flex-wrap">
          <div className="flex w-full flex-col flex-wrap p-3 md:flex md:w-7/12 md:flex-row md:flex-nowrap md:items-center md:gap-10">
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
              </>
            )}
            <div>
              <p className="text-xs text-gray-secondary">{t('assignment.lisatty')}</p>
              <p className="text-xs text-black">{toLocaleDate(assignmentCard.createdAt)}</p>
            </div>
          </div>
          <AssignmentCardContentActions
            assignment={assignmentCard}
            favoriteAction={{
              isFavorite,
              onClick: () => (isFavorite ? unFavorite(assignmentCard) : setIsFavoriteModalOpen(true)),
              isDisabled: !favoriteIds
            }}
            moveFolderAction={moveFolderAction}
          />
        </div>
      </li>

      {isFavoriteModalOpen && favoriteIds && (
        <SetFavoriteFoldersModal
          isFavorite={isFavorite}
          assignmentCard={assignmentCard}
          favoriteIds={favoriteIds}
          assignmentName={
            (teachingLanguage === Language.FI ? assignmentCard.nameFi : assignmentCard.nameSv) || t('form.nimeton')
          }
          onClose={() => setIsFavoriteModalOpen(false)}
          onSetFavoriteFoldersAction={onSetFavoriteFoldersAction}
        />
      )}
    </>
  )
}
