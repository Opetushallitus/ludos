import { useState } from 'react'
import { Button } from '../Button'
import { useTranslation } from 'react-i18next'
import { useModal } from './useModal'
import styles from './modal.module.css'
import { ModalHeader } from './ModalHeader'
import { useInputAutoFocus } from '../../hooks/useInputAutoFocus'

interface ModalProps {
  modalTitle: string
  inputLabel: string
  initialText?: string
  autoSelectInputText?: boolean
  onClose: () => void
  onAddText: (url: string) => void
  dataTestId: string
}

export const TextInputModal = ({
  modalTitle,
  inputLabel,
  initialText,
  autoSelectInputText,
  onClose,
  onAddText,
  dataTestId
}: ModalProps) => {
  const { t } = useTranslation()
  const { dialogClasses, onCancel, onAnimEnd, modalRef, onClick } = useModal({ open: true, onClose })
  const [text, setText] = useState(initialText ?? '')
  const inputRef = useInputAutoFocus(true, autoSelectInputText)

  const handleSubmitText = () => {
    onAddText(text)
    setText('')
  }

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
      <div className={styles['modal__container']}>
        <ModalHeader modalTitle={modalTitle} onClick={onClose} />

        <div className="min-h-[10vh] p-6">
          <label className="font-semibold" htmlFor={`${dataTestId}-input`}>
            {inputLabel}
          </label>
          <input
            id={`${dataTestId}-input`}
            ref={inputRef}
            data-testid={`${dataTestId}-input`}
            type="text"
            className="block w-full border border-gray-secondary p-2.5"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmitText()
              }
            }}
          />
        </div>

        <div className="m-8 flex justify-end gap-5">
          <Button variant="buttonGhost" onClick={onClose} data-testid="modal-button-cancel">
            {t('common.peruuta')}
          </Button>
          <Button
            variant="buttonPrimary"
            onClick={handleSubmitText}
            disabled={text.length === 0}
            data-testid="modal-button-add">
            {t('common.lisaa')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
