import React, { ReactNode } from 'react'
import styles from './modal.module.css'
import { Button } from '../Button'
import { useTranslation } from 'react-i18next'
import { useModal } from './useModal'
import { ModalHeader } from './ModalHeader'

interface ModalProps {
  modalTitle: string
  open: boolean
  onClose: () => void
  onDeleteAction: () => void
  children: ReactNode
}

export const DeleteModal = ({ modalTitle, open, onClose, onDeleteAction, children }: ModalProps) => {
  const { t } = useTranslation()
  const { modalRef, dialogClasses, onCancel, onAnimEnd, onClick } = useModal({ open, onClose })

  return (
    <dialog
      ref={modalRef}
      className={dialogClasses}
      onClose={onClose}
      onCancel={onCancel}
      onClick={onClick}
      onAnimationEnd={onAnimEnd}
      aria-modal="true">
      <div className={styles['modal__container']}>
        <ModalHeader modalTitle={modalTitle} onClick={onClose} />

        {children}

        <div className="flex-grow" />

        <div className="m-8 flex justify-end gap-5">
          <Button variant="buttonGhost" onClick={onClose} data-testid="modal-button-cancel">
            {t('common.peruuta')}
          </Button>
          <Button variant="buttonDanger" onClick={onDeleteAction} data-testid="modal-button-delete">
            {t('common.poista')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
