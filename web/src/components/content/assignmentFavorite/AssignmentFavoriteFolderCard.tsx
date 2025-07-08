import { Exam, FavoriteCardFolderDtoOut } from '../../../types'
import { Icon } from '../../Icon'
import { InternalLink } from '../../InternalLink'
import { AssignmentFavoriteFolderDropdownMenu } from './AssignmentFavoriteFolderDropdownMenu'

type AssignmentFavoriteFolderCardProps = {
  exam: Exam
  favoriteCardFolders: FavoriteCardFolderDtoOut
  currentFavoriteCardFolder: FavoriteCardFolderDtoOut
  refresh: () => void
}

export const AssignmentFavoriteFolderCard = ({
  exam,
  favoriteCardFolders,
  currentFavoriteCardFolder,
  refresh
}: AssignmentFavoriteFolderCardProps) => (
  <div
    className="row justify-between items-center border-2 border-gray-light h-14 rounded px-3 my-3"
    data-testid={`folder-${currentFavoriteCardFolder.id}-card`}
  >
    <div className="flex items-center gap-2">
      <Icon name="kansio" color="text-black" size="lg" />
      <InternalLink to={`/suosikit/${exam.toLowerCase()}/${currentFavoriteCardFolder.id}`} data-testid="link">
        {currentFavoriteCardFolder.name}
      </InternalLink>
    </div>

    {currentFavoriteCardFolder.id && (
      <AssignmentFavoriteFolderDropdownMenu
        exam={exam}
        favoriteCardFolders={favoriteCardFolders}
        currentFavoriteCardFolder={currentFavoriteCardFolder}
        refresh={refresh}
      />
    )}
  </div>
)
