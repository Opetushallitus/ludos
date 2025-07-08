import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { findParentFolder } from '../../../assignmentFavoriteFolderHelpers'
import { useNotification } from '../../../contexts/NotificationContext'
import { useDropdownCloseOnBlur } from '../../../hooks/useDropdownCloseOnBlur'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { deleteFavoriteFolder, SessionExpiredFetchError, updateFavoriteFolder } from '../../../request'
import { Exam, FavoriteCardFolderDtoOut } from '../../../types'
import { Button } from '../../Button'
import { Icon } from '../../Icon'
import { favoritesPagePath } from '../../LudosRoutes'
import { AssignmentFavoriteMoveFolderModal } from '../../modal/AssignmentFavoriteMoveFolderModal'
import { DeleteModal } from '../../modal/DeleteModal'
import { TextInputModal } from '../../modal/TextInputModal'

type AssignmentFavoriteFolderDropdownMenuProps = {
  exam: Exam
  favoriteCardFolders: FavoriteCardFolderDtoOut
  currentFavoriteCardFolder: FavoriteCardFolderDtoOut
  refresh: () => void
}

export const AssignmentFavoriteFolderDropdownMenu = ({
  exam,
  favoriteCardFolders,
  currentFavoriteCardFolder,
  refresh
}: AssignmentFavoriteFolderDropdownMenuProps) => {
  const { t } = useLudosTranslation()
  const { setNotification } = useNotification()
  const navigate = useNavigate()

  const [showActionMenu, setShowActionMenu] = useState(false)

  const [modalStates, setModalStates] = useState({
    openRenameFolderModal: false,
    openMoveToFolderModal: false,
    openDeleteFolderModal: false
  })

  const showActionMenuRef = useDropdownCloseOnBlur<boolean>(false, setShowActionMenu)

  const requestWrapper = async (request: () => Promise<void>) => {
    try {
      await request()
    } catch (e) {
      if (e instanceof SessionExpiredFetchError) {
        throw SessionExpiredFetchError
      } else if (e instanceof Error) {
        setNotification({ message: t('error.odottamaton-virhe'), type: 'error' })
      } else {
        setNotification({ message: t('error.odottamaton-virhe'), type: 'error' })
      }
    }
  }

  const cleanUpState = () => {
    refresh()
    setShowActionMenu(false)
    setModalStates({
      openRenameFolderModal: false,
      openMoveToFolderModal: false,
      openDeleteFolderModal: false
    })
  }

  const handleMoveFolder = async (selectedFolderId: number) => {
    await requestWrapper(() =>
      updateFavoriteFolder(exam, currentFavoriteCardFolder.id, currentFavoriteCardFolder.name, selectedFolderId)
    )
    cleanUpState()
  }

  const handleRenameFolder = async (folderName: string) => {
    const parentFolderId = findParentFolder(favoriteCardFolders, currentFavoriteCardFolder.id)
    await requestWrapper(() => updateFavoriteFolder(exam, currentFavoriteCardFolder.id, folderName, parentFolderId))
    cleanUpState()
  }

  const handleDeleteFolder = async () => {
    await deleteFavoriteFolder(exam, currentFavoriteCardFolder.id)
    const parentFolderId = findParentFolder(favoriteCardFolders, currentFavoriteCardFolder.id)
    navigate(`${favoritesPagePath(exam)}/${parentFolderId}`, { replace: true })

    cleanUpState()
  }

  return (
    <div className="inline-block relative pr-8" ref={showActionMenuRef}>
      <Button
        variant="buttonGhost"
        onClick={() => setShowActionMenu((curr) => !curr)}
        customClass="p-0"
        id="menu-button"
        data-testid="folder-action-menu-btn"
        aria-expanded={showActionMenu}
      >
        <Icon name="kolme-pistetta" color="text-green-primary" customClass="text-[2rem] mt-2" />
      </Button>
      {showActionMenu && (
        <div
          className="absolute right-10 top-10 z-10 py-2 w-56 origin-top-right bg-white rounded-md border border-gray-border shadow-lg"
          role="menu"
          aria-labelledby="menu-button"
        >
          <Button
            variant="buttonGhost"
            tabIndex={0}
            customClass="w-full text-left"
            data-testid="move-folder-btn"
            onClick={() => setModalStates({ ...modalStates, openMoveToFolderModal: true })}
          >
            <span className="text-green-primary">{t('favorite.folder.siirra-kansio')}</span>
          </Button>
          <div className="border-t border-gray-separator" />
          <Button
            variant="buttonGhost"
            tabIndex={0}
            customClass="w-full text-left"
            data-testid="delete-folder-btn"
            onClick={() => setModalStates({ ...modalStates, openDeleteFolderModal: true })}
          >
            <span className="text-green-primary">{t('favorite.folder.poista-kansio')}</span>
          </Button>
          <div className="border-t border-gray-separator" />
          <Button
            variant="buttonGhost"
            tabIndex={0}
            customClass="w-full text-left"
            data-testid="rename-folder-btn"
            onClick={() => setModalStates({ ...modalStates, openRenameFolderModal: true })}
          >
            <span className="text-green-primary">{t('favorite.folder.nimea-uudelleen')}</span>
          </Button>
        </div>
      )}

      {modalStates.openMoveToFolderModal && (
        <AssignmentFavoriteMoveFolderModal
          folder={currentFavoriteCardFolder}
          favoriteCardFolders={favoriteCardFolders}
          onSubmit={handleMoveFolder}
          onClose={() => setModalStates((curr) => ({ ...curr, openMoveToFolderModal: false }))}
        />
      )}
      {modalStates.openRenameFolderModal && (
        <TextInputModal
          modalTitle={t('favorite.folder.nimea-uudelleen')}
          inputLabel={t('favorite.kansion-nimi')}
          initialText={currentFavoriteCardFolder.name}
          autoSelectInputText={true}
          onClose={() => setModalStates((curr) => ({ ...curr, openRenameFolderModal: false }))}
          onAddText={handleRenameFolder}
          dataTestId="rename-folder"
        />
      )}
      {modalStates.openDeleteFolderModal && (
        <DeleteModal
          modalTitle={t('favorite.folder.poista-kansio')}
          open
          onClose={() => setModalStates((curr) => ({ ...curr, openDeleteFolderModal: false }))}
          onDeleteAction={handleDeleteFolder}
        >
          <div className="h-[10vh] p-6">
            <p>{t('favorite.folder.poista-kansio-leipateksti')}</p>
          </div>
        </DeleteModal>
      )}
    </div>
  )
}
