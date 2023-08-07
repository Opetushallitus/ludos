import React, { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'
import styles from './modal.module.css'
import { Icon } from '../Icon'
import { Button } from '../Button'
import { useTranslation } from 'react-i18next'

interface ModalProps {
  modalTitle: string
  open: boolean
  onClose: () => void
  onDeleteAction: () => void
  children: ReactNode
}

export const DeleteModal = ({ modalTitle, open, onClose, onDeleteAction, children }: ModalProps) => {
  const { t } = useTranslation()
  const modalRef = useRef<HTMLDialogElement>(null)

  const dialogClasses = useMemo(() => {
    const _arr = [styles['modal']]

    if (!open) {
      _arr.push(styles['modal--closing'])
    }

    return _arr.join(' ')
  }, [open])

  const onCancel = useCallback(() => {
    onClose()
  }, [onClose])

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      const { current } = modalRef
      if (e.target === current) {
        onClose()
      }
    },
    [onClose]
  )

  const onAnimEnd = useCallback(() => {
    const { current } = modalRef
    if (!open) {
      current?.close()
    }
  }, [open])

  useEffect(() => {
    const { current } = modalRef
    if (open) {
      current?.close() // Ensure the dialog is closed before opening
      current?.showModal()
    } else {
      current?.close()
    }
  }, [open, onClose])

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
        <div className="row justify-between bg-green-primary p-2">
          <h2 className="text-base text-white" id="modal-title">
            {modalTitle}
          </h2>
          <button className="modal__close-button text-right" onClick={onClose} aria-label="modal-close">
            <Icon name="sulje" color="text-white" />
          </button>
        </div>

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
