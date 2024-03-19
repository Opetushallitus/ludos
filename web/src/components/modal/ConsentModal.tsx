import React, { ReactNode, useState } from 'react'
import styles from './modal.module.css'
import { Button } from '../Button'
import { useTranslation } from 'react-i18next'
import { useModal } from './useModal'
import { ModalHeader } from './ModalHeader'
import { twMerge } from 'tailwind-merge'
import { ExternalLink } from '../ExternalLink'
import { TIETOSUOJA_SELOSTE_URL } from '../../constants'

interface ConsentModalProps {}

export const ConsentModal = ({}: ConsentModalProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(true)
  const onClose = () => setIsOpen(false)
  const { modalRef, dialogClasses, onCancel, onAnimEnd } = useModal({ open: isOpen, onClose })
  const margin = 'm-6'

  return (
    <dialog
      ref={modalRef}
      className={dialogClasses}
      /*onClose={onClose}*/
      onCancel={(e) => {
        e.preventDefault()
      }}
      onAnimationEnd={onAnimEnd}
      aria-modal="true"
      data-testid="consent-modal">
      <div className={styles['modal__container']}>
        <ModalHeader modalTitle={t('consent.modal.title')} />

        <div className="flex-grow" />

        <p className={margin}>{t('consent.modal.general-info')}</p>

        <div className={margin}>
          <ExternalLink url={TIETOSUOJA_SELOSTE_URL}>{t('footer.tietosuoja')}</ExternalLink>
        </div>

        {isSettingsOpen && (
          <div className={twMerge(margin, 'border-t border-separate')}>
            <h3 className="my-3">{t('consent.modal.settings-title')}</h3>
            <input type="checkbox" disabled checked id="consent-mandatory-checkbox" name="mandatory" />
            <label className="pl-2" htmlFor="consent-mandatory-checkbox">
              {t('consent.modal.checkbox.mandatory')}
            </label>
            <br />
            <input type="checkbox" id="consent-mandatory-tracking" name="tracking" />
            <label className="pl-2" htmlFor="consent-mandatory-checkbox">
              {t('consent.modal.checkbox.tracking')}
            </label>
          </div>
        )}

        <div className={twMerge('flex justify-end gap-5 min-w-[650px]', margin)}>
          <Button
            variant="buttonSecondary"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            data-testid="settings-button">
            {isSettingsOpen ? t('consent.modal.hide-settings') : t('consent.modal.show-settings')}
          </Button>
          {isSettingsOpen && (
            <Button variant="buttonSecondary" onClick={onClose} data-testid="accept-all-button">
              {t('consent.modal.accept-selected')}
            </Button>
          )}
          <Button variant="buttonPrimary" onClick={onClose} data-testid="accept-all-button">
            {t('consent.modal.accept-all')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
