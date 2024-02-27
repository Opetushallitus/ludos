import { AssignmentFavoriteFolderCard } from './AssignmentFavoriteFolderCard'
import { filterByTeachingLanguage } from '../list/assignment/AssignmentList'
import { AssignmentCard } from '../list/assignment/AssignmentCard'
import { favoriteIdsFromFavoriteCardFolders } from '../../../assignmentFavoriteFolderHelpers'
import { InfoBox } from '../../InfoBox'
import { Exam, FavoriteCardFolderDtoOut } from '../../../types'
import { useTranslation } from 'react-i18next'
import { useContext } from 'react'
import { LudosContext } from '../../../contexts/LudosContext'

type FolderAndAssignmentListProps = {
  exam: Exam
  favoriteCardFolders: FavoriteCardFolderDtoOut
  currentFavoriteCardFolder: FavoriteCardFolderDtoOut
  refresh: () => void
}

export const FolderAndAssignmentList = ({
  exam,
  favoriteCardFolders,
  currentFavoriteCardFolder,
  refresh
}: FolderAndAssignmentListProps) => {
  const { t } = useTranslation()
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
            refresh={refresh}
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
                  key={i}
                  favoriteIdsRefresh={refresh}
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
