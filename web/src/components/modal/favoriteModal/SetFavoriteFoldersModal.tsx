import styles from '../modal.module.css'
import { useModal } from '../useModal'
import { ModalHeader } from '../ModalHeader'
import { AssignmentCardOut, FavoriteIdsDtoOut } from '../../../types'
import { FavoriteToggleModalFormType } from './favoriteToggleModalFormSchema'
import { FavoriteForm } from './FavoriteForm'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { twMerge } from 'tailwind-merge'

type SetFavoriteFoldersModalProps = {
  isFavorite: boolean
  assignmentCard: AssignmentCardOut
  favoriteIds: FavoriteIdsDtoOut
  assignmentName: string
  onClose: () => void
  onSetFavoriteFoldersAction: (data: FavoriteToggleModalFormType) => void
}

export const SetFavoriteFoldersModal = ({
  isFavorite,
  assignmentCard,
  favoriteIds,
  assignmentName,
  onClose,
  onSetFavoriteFoldersAction
}: SetFavoriteFoldersModalProps) => {
  const { t } = useLudosTranslation()

  const { modalRef, dialogClasses, onClick, onCancel, onAnimEnd } = useModal({ open: true, onClose })

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={modalRef}
      className={dialogClasses}
      onClose={onClose}
      onCancel={onCancel}
      onClick={onClick}
      onAnimationEnd={onAnimEnd}
      aria-modal="true">
      <div className={twMerge(styles['modal__container'], 'w-[30vw]')}>
        <ModalHeader
          modalTitle={isFavorite ? t('favorite.muokkaa-suosikkeja') : t('favorite.lisaa-suosikiksi')}
          onClick={onClose}
        />

        <p className="p-3 font-semibold">{assignmentName}</p>

        <FavoriteForm
          isFavorite={isFavorite}
          assignmentCard={assignmentCard}
          favoriteIds={favoriteIds}
          onClose={onClose}
          onSetFavoriteFoldersAction={onSetFavoriteFoldersAction}
        />
      </div>
    </dialog>
  )
}
