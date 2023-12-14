import { useEffect, useRef, useState } from 'react'
import { Button } from '../Button'
import { useTranslation } from 'react-i18next'
import { useModal } from './useModal'
import styles from './modal.module.css'
import { ModalHeader } from './ModalHeader'

interface ModalProps {
  modalTitle: string
  open: boolean
  onClose: () => void
  onAddUrlAction: (url: string) => void
  dataTestId: string
}

export const AddUrlModal = ({ modalTitle, open, onClose, onAddUrlAction, dataTestId }: ModalProps) => {
  const { t } = useTranslation()
  const { dialogClasses, onCancel, onAnimEnd, modalRef, onClick } = useModal({ open, onClose })
  const [url, setUrl] = useState('')
  const urlInputRef = useInputAutoFocus(open)

  const handleSubmitUrl = () => {
    onAddUrlAction(url)
    setUrl('')
  }

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

        <div className="h-[15vh] p-6">
          <label className="font-semibold" htmlFor={`${dataTestId}-url-input`}>
            {t('form.lisaa-url')}
          </label>
          <input
            id={`${dataTestId}-url-input`}
            ref={urlInputRef}
            data-testid={`${dataTestId}-url-input`}
            type="text"
            className="block w-full border border-gray-secondary p-2.5"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmitUrl()
              }
            }}
          />
        </div>

        <div className="flex-grow" />

        <div className="m-8 flex justify-end gap-5">
          <Button variant="buttonGhost" onClick={onClose} data-testid="modal-button-cancel">
            {t('common.peruuta')}
          </Button>
          <Button variant="buttonPrimary" onClick={handleSubmitUrl} data-testid="modal-button-add">
            {t('common.lisaa')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}

function useInputAutoFocus(open: boolean) {
  const focusRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      focusRef.current?.focus()
    }
  }, [open])

  return focusRef
}
