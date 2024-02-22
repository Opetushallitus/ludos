import { Breadcrumbs } from '../../Breadcrumbs'
import { Button } from '../../Button'
import { Icon } from '../../Icon'
import { Exam, FavoriteCardFolderDtoOut } from '../../../types'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { TextInputModal } from '../../modal/TextInputModal'
import { useState } from 'react'
import { createFavoriteFolder } from '../../../request'
import { useNotification } from '../../../contexts/NotificationContext'
import { AssignmentFavoriteFolderDropdownMenu } from './AssignmentFavoriteFolderDropdownMenu'
import { FolderList } from '../../modal/AssignmentFavoriteMoveFolderModal'

type AssignmentFavoriteTopBarProps = {
  exam: Exam
  assignmentFavorites: FavoriteCardFolderDtoOut
  currentFolder: FavoriteCardFolderDtoOut
  segments: FolderList
  refresh: () => void
}

export const AssignmentFavoriteTopBar = ({
  exam,
  assignmentFavorites,
  currentFolder,
  segments,
  refresh
}: AssignmentFavoriteTopBarProps) => {
  const { t } = useLudosTranslation()
  const { setNotification } = useNotification()

  const [openAddNewFolderModal, setOpenAddNewFolderModal] = useState(false)

  const handleAddNewFolder = async (folderName: string, currentFolder: FavoriteCardFolderDtoOut) => {
    try {
      await createFavoriteFolder(exam, folderName, currentFolder.id)
      setNotification({ message: t('favorite.lisaa-kansio-onnistui'), type: 'success' })
      setOpenAddNewFolderModal(false)
      refresh()
    } catch (e) {
      setNotification({ message: t('error.lisaa-kansio-epaonnistui'), type: 'error' })
    }
  }

  return (
    <>
      <div className="row flex-wrap justify-between pb-3 pt-6">
        {segments.length > 1 && currentFolder.id ? (
          <div className="row items-center gap-2">
            <Breadcrumbs exam={exam} segments={segments} />
            <AssignmentFavoriteFolderDropdownMenu
              exam={exam}
              favoriteCardFolders={assignmentFavorites}
              currentFavoriteCardFolder={currentFolder}
              refresh={refresh}
            />
          </div>
        ) : (
          <div />
        )}
        <Button variant="buttonPrimary" onClick={() => setOpenAddNewFolderModal(true)} data-testid="add-new-folder-btn">
          <span className="flex items-center">
            <Icon name="lisää" color="text-white" size="lg" />
            <span className="pl-1">{t('favorite.lisaa-kansio')}</span>
          </span>
        </Button>
      </div>
      {openAddNewFolderModal && (
        <TextInputModal
          modalTitle={t('favorite.lisaa-kansio')}
          inputLabel={t('favorite.kansion-nimi')}
          onClose={() => setOpenAddNewFolderModal(false)}
          onAddText={(folderName) => handleAddNewFolder(folderName, currentFolder)}
          dataTestId="add-new-folder-button"
        />
      )}
    </>
  )
}
