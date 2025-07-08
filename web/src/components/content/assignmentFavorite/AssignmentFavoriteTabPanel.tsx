import { findCurrentData, findFolderPathTo } from '../../../assignmentFavoriteFolderHelpers'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { Exam, FavoriteCardFolderDtoOut } from '../../../types'
import { InfoBox } from '../../InfoBox'
import { AssignmentFavoriteTopBar } from './AssignmentFavoriteTopBar'
import { FolderAndAssignmentList } from './FolderAndAssignmentList'

type AssignmentFavoriteTapPanelProps = {
  exam: Exam
  folderId: string
  favoriteCardFolders: FavoriteCardFolderDtoOut
  favoriteCardFoldersRefetch: () => void
}

export const AssignmentFavoriteTabPanel = ({
  exam,
  folderId,
  favoriteCardFolders,
  favoriteCardFoldersRefetch
}: AssignmentFavoriteTapPanelProps) => {
  const { lt } = useLudosTranslation()

  const data = findCurrentData(folderId, favoriteCardFolders)

  if (!data) {
    return null
  }

  return (
    <div role="tabpanel">
      <AssignmentFavoriteTopBar
        exam={exam}
        assignmentFavorites={favoriteCardFolders}
        segments={findFolderPathTo(favoriteCardFolders, Number(folderId))}
        currentFolder={data}
        favoriteCardFoldersRefetch={favoriteCardFoldersRefetch}
      />
      {data.assignmentCards.length === 0 && data.subfolders.length === 0 ? (
        <InfoBox type="info" i18nKey={lt.favoritePageNoContentMessage[exam]} />
      ) : (
        <FolderAndAssignmentList
          exam={exam}
          currentFavoriteCardFolder={data}
          favoriteCardFolders={favoriteCardFolders}
          favoriteCardFoldersRefetch={favoriteCardFoldersRefetch}
        />
      )}
    </div>
  )
}
