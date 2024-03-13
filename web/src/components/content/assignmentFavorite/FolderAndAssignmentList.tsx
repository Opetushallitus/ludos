import { AssignmentFavoriteFolderCard } from './AssignmentFavoriteFolderCard'
import { filterByTeachingLanguage } from '../list/assignment/AssignmentList'
import { AssignmentCard } from '../list/assignment/AssignmentCard'
import { favoriteIdsFromFavoriteCardFolders } from '../../../assignmentFavoriteFolderHelpers'
import { InfoBox } from '../../InfoBox'
import { Exam, FavoriteCardFolderDtoOut } from '../../../types'
import { useContext } from 'react'
import { LudosContext } from '../../../contexts/LudosContext'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'

type FolderAndAssignmentListProps = {
  exam: Exam
  favoriteCardFolders: FavoriteCardFolderDtoOut
  currentFavoriteCardFolder: FavoriteCardFolderDtoOut
  favoriteCardFoldersRefetch: () => void
}

export const FolderAndAssignmentList = ({
  exam,
  favoriteCardFolders,
  currentFavoriteCardFolder,
  favoriteCardFoldersRefetch
}: FolderAndAssignmentListProps) => {
  const { t } = useLudosTranslation()
  const { teachingLanguage } = useContext(LudosContext)

  const languageOverrideIfSukoAssignment = exam === Exam.SUKO ? 'FI' : teachingLanguage

  const hasAssignments = currentFavoriteCardFolder.assignmentCards.length > 0

  return (
    <div>
      <>
        {currentFavoriteCardFolder.subfolders.map((folder, i) => (
          <AssignmentFavoriteFolderCard
            exam={exam}
            favoriteCardFolders={favoriteCardFolders}
            currentFavoriteCardFolder={folder}
            refresh={favoriteCardFoldersRefetch}
            key={i}
          />
        ))}

        <ul data-testid="card-list">
          {hasAssignments ? (
            currentFavoriteCardFolder.assignmentCards
              .filter((val) => filterByTeachingLanguage(val, languageOverrideIfSukoAssignment))
              .map((assignment, i) => (
                <AssignmentCard
                  teachingLanguage={languageOverrideIfSukoAssignment}
                  assignmentCard={assignment}
                  favoriteIds={favoriteIdsFromFavoriteCardFolders(favoriteCardFolders)}
                  refetchFavoriteIds={favoriteCardFoldersRefetch}
                  key={i}
                />
              ))
          ) : (
            <InfoBox type="info" i18nKey={t('favorite.tyhja-kansio-viesti')} />
          )}
        </ul>
      </>
    </div>
  )
}
