import { ContentType, ContentTypeSingularEn, Exam, FavoriteCardFolderDtoOut } from '../../../types'
import { useParams } from 'react-router-dom'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { useFetch } from '../../../hooks/useFetch'
import { InfoBox } from '../../InfoBox'
import { findCurrentData } from '../../../assignmentFavoriteFolderHelpers'
import { PageLoadingIndicator } from '../../PageLoadingIndicator'
import { PageNotFound } from '../../LudosRoutes'
import { AssignmentFavoriteTabPanel } from './AssignmentFavoriteTabPanel'
import { ListTabs } from '../../ListTabs'

export const AssignmentFavorite = () => {
  const { t, lt } = useLudosTranslation()
  const { exam: examParamLowerCase, folderId } = useParams<{ exam?: string; folderId?: string }>()

  const exam = Exam[examParamLowerCase?.toUpperCase() as Exam]
  const contentType = ContentType.ASSIGNMENT

  const {
    data: favoriteCardFolders,
    loading: favoriteCardFoldersLoading,
    error: favoriteCardFoldersError,
    refresh
  } = useFetch<FavoriteCardFolderDtoOut>(
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
