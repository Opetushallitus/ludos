import { ContentType, ContentTypeSingularEng, Exam, FavoriteCardFolderDtoOut } from '../../../types'
import { useParams } from 'react-router-dom'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { useFetch } from '../../../hooks/useFetch'
import { AssignmentFavoriteExamMenu } from './AssignmentFavoriteExamMenu'
import { InfoBox } from '../../InfoBox'
import { findCurrentData } from '../../../assignmentFavoriteFolderHelpers'
import { PageLoadingIndicator } from '../../PageLoadingIndicator'
import { PageNotFound } from '../../LudosRoutes'
import { AssignmentFavoriteTabPanel } from './AssignmentFavoriteTabPanel'

export const AssignmentFavorite = () => {
  const { t, lt } = useLudosTranslation()
  const { exam: examParamLowerCase, folderId } = useParams<{ exam?: string; folderId?: string }>()

  const exam = Exam[examParamLowerCase?.toUpperCase() as Exam]
  const contentType = ContentType.koetehtavat

  const {
    data: favoriteCardFolders,
    loading: favoriteCardFoldersLoading,
    error: favoriteCardFoldersError,
    refresh
  } = useFetch<FavoriteCardFolderDtoOut>(
    `${ContentTypeSingularEng[contentType]}/favorites/${exam.toLocaleUpperCase()}/cardFolders`
  )

  if (favoriteCardFoldersError) {
    return <InfoBox type="error" i18nKey={lt.contentListErrorMessage[contentType]} />
  }

  return (
    <div className="pt-3">
      <h2 className="mb-3" data-testid="favorite-page-heading">
        {t('favorite.suosikkitehtavat')}
      </h2>

      <AssignmentFavoriteExamMenu />

      {favoriteCardFoldersLoading && <PageLoadingIndicator />}

      {favoriteCardFolders && (
        <>
          {findCurrentData(folderId, favoriteCardFolders) ? (
            <AssignmentFavoriteTabPanel
              exam={exam}
              folderId={folderId!}
              favoriteCardFolders={favoriteCardFolders}
              refresh={refresh}
            />
          ) : (
            <PageNotFound />
          )}
        </>
      )}
    </div>
  )
}
