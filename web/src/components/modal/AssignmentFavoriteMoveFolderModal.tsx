import { useState } from 'react'
import { makeFlatListFromFolder } from '../../assignmentFavoriteFolderHelpers'
import { FAVORITE_ROOT_FOLDER_ID } from '../../constants'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { FavoriteCardFolderDtoOut } from '../../types'
import { Button } from '../Button'
import { ModalHeader } from './ModalHeader'
import styles from './modal.module.css'
import { useModal } from './useModal'

export type FolderList = { id: number; name: string }[]

type AssignmentFavoriteMoveFolderModalProps = {
  folder: FavoriteCardFolderDtoOut
  favoriteCardFolders: FavoriteCardFolderDtoOut
  onSubmit: (selectedFolderId: number) => void
  onClose: () => void
}

export const AssignmentFavoriteMoveFolderModal = ({
  folder,
  favoriteCardFolders,
  onSubmit,
  onClose
}: AssignmentFavoriteMoveFolderModalProps) => {
  const { t } = useLudosTranslation()
  const { modalRef, dialogClasses, onClick, onCancel, onAnimEnd } = useModal({ open: true, onClose })
  const [selectedFolderId, setSelectedFolderId] = useState(folder.id)

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={modalRef}
      className={dialogClasses}
      onClose={onClose}
      onCancel={onCancel}
      onClick={onClick}
      onAnimationEnd={onAnimEnd}
      aria-modal="true"
    >
      <div className={styles['modal__container']}>
        <ModalHeader modalTitle={t('favorite.folder.siirra-kansioon')} onClick={onClose} />

        <p className="p-3 font-semibold">{t('favorite.valitse-kansio')}</p>
        <FavoriteFolderRadio
          folders={makeFlatListFromFolder(favoriteCardFolders)}
          checkedFolder={selectedFolderId}
          setCheckedFolder={setSelectedFolderId}
        />

        <div className="border-b border-gray-separator py-2" />

        <div className="m-6 flex justify-end gap-5">
          <Button variant="buttonGhost" onClick={onClose} data-testid="modal-button-cancel">
            {t('common.peruuta')}
          </Button>
          <Button
            variant="buttonPrimary"
            onClick={() => onSubmit(selectedFolderId)}
            disabled={selectedFolderId === folder.id}
            data-testid="modal-button-add-to-favorites"
          >
            {t('favorite.folder.siirra-kansioon')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}

type FavoriteFolderRadioProps = {
  folders: FolderList
  checkedFolder: number
  setCheckedFolder: (id: number) => void
}

export const FavoriteFolderRadio = ({ folders, checkedFolder, setCheckedFolder }: FavoriteFolderRadioProps) => {
  const { t } = useLudosTranslation()

  return (
    <div className="pb-4">
      {folders.map(({ id, name }, i) => (
        <div key={i} className="flex flex-wrap pl-4 w-full">
          <input
            type="radio"
            id={`folder-${id}`}
            value={id}
            onChange={() => setCheckedFolder(id)}
            checked={id === checkedFolder}
          />
          <label className="pl-2" htmlFor={`folder-${id}`}>
            {id === FAVORITE_ROOT_FOLDER_ID ? t('favorite.suosikkien-paataso') : name}
          </label>
        </div>
      ))}
    </div>
  )
}
