import { AssignmentFavoriteTopBar } from './AssignmentFavoriteTopBar'
import { findCurrentData, findFolderPathTo } from '../../../assignmentFavoriteFolderHelpers'
import { InfoBox } from '../../InfoBox'
import { FolderAndAssignmentList } from './FolderAndAssignmentList'
import { Exam, FavoriteCardFolderDtoOut } from '../../../types'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'

type AssignmentFavoriteTapPanelProps = {
  exam: Exam
  folderId: string
  favoriteCardFolders: FavoriteCardFolderDtoOut
  refresh: () => void
}

export const AssignmentFavoriteTabPanel = ({
  exam,
  folderId,
  favoriteCardFolders,
  refresh
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
        refresh={refresh}
      />
      {data.assignmentCards.length === 0 && data.subfolders.length === 0 ? (
        <InfoBox type="info" i18nKey={lt.favoritePageNoContentMessage[exam]} />
      ) : (
        <FolderAndAssignmentList
          exam={exam}
          currentFavoriteCardFolder={data}
          favoriteCardFolders={favoriteCardFolders}
          refresh={refresh}
        />
      )}
    </div>
  )
}
