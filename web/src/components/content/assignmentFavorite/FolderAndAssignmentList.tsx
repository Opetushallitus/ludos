import { useContext } from 'react'
import { favoriteIdsFromFavoriteCardFolders } from '../../../assignmentFavoriteFolderHelpers'
import { LudosContext } from '../../../contexts/LudosContext'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { AssignmentCardOut, Exam, FavoriteCardFolderDtoOut, Language } from '../../../types'
import { InfoBox } from '../../InfoBox'
import { AssignmentCard } from '../list/assignment/AssignmentCard'
import { AssignmentFavoriteFolderCard } from './AssignmentFavoriteFolderCard'

type FolderAndAssignmentListProps = {
  exam: Exam
  favoriteCardFolders: FavoriteCardFolderDtoOut
  currentFavoriteCardFolder: FavoriteCardFolderDtoOut
  favoriteCardFoldersRefetch: () => void
}

const filterByTeachingLanguage = (data: AssignmentCardOut, teachingLanguage: Language) => {
  if (teachingLanguage === Language.FI) {
    return data.nameFi !== ''
  } else if (teachingLanguage === Language.SV) {
    return data.nameSv !== ''
  }
  return true
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
