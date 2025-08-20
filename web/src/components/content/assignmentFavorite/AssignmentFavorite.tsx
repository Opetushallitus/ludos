import { useParams } from 'react-router-dom'
import { findCurrentData } from '../../../assignmentFavoriteFolderHelpers'
import { useFetch } from '../../../hooks/useFetch'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { ContentType, ContentTypeSingularEn, Exam, FavoriteCardFolderDtoOut } from '../../../types'
import { InfoBox } from '../../InfoBox'
import { ListTabs } from '../../ListTabs'
import { PageNotFound } from '../../LudosRoutes'
import { PageLoadingIndicator } from '../../PageLoadingIndicator'
import { AssignmentFavoriteTabPanel } from './AssignmentFavoriteTabPanel'

export const AssignmentFavorite = () => {
  const { t, lt } = useLudosTranslation()
  const { exam: examParamLowerCase, folderId } = useParams<{ exam?: string; folderId?: string }>()

  const exam = Exam[examParamLowerCase?.toUpperCase() as Exam]
  const contentType = ContentType.ASSIGNMENT

  const {
    data: favoriteCardFolders,
    isFetching: favoriteCardFoldersLoading,
    error: favoriteCardFoldersError,
    refetch: favoriteCardFoldersRefetch
  } = useFetch<FavoriteCardFolderDtoOut>(
    ['favoriteCardFolders'],
    `${ContentTypeSingularEn[contentType]}/favorites/${exam.toLocaleUpperCase()}/cardFolders`
  )

  if (favoriteCardFoldersError) {
    return <InfoBox type="error" i18nKey={lt.contentListErrorMessage[contentType]} />
  }

  return (
    <div className="min-h-[80vh] mt-10">
      <h2 className="mb-3" data-testid="favorite-page-heading">
        {t('favorite.suosikkitehtavat')}
      </h2>

      <ListTabs />

      {favoriteCardFoldersLoading && <PageLoadingIndicator />}

      {favoriteCardFolders && (
        <>
          {findCurrentData(folderId, favoriteCardFolders) ? (
            <AssignmentFavoriteTabPanel
              exam={exam}
              folderId={folderId!}
              favoriteCardFolders={favoriteCardFolders}
              favoriteCardFoldersRefetch={favoriteCardFoldersRefetch}
            />
          ) : (
            <PageNotFound />
          )}
        </>
      )}
    </div>
  )
}
