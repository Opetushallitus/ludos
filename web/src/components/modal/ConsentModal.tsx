import React, { forwardRef, ForwardRefRenderFunction, useEffect, useImperativeHandle, useState } from 'react'
import styles from './modal.module.css'
import { Button } from '../Button'
import { useModal } from './useModal'
import { ModalHeader } from './ModalHeader'
import { twMerge } from 'tailwind-merge'
import { ExternalLink } from '../ExternalLink'
import { TIETOSUOJA_SELOSTE_URL } from '../../constants'
import { getCookie, removeCookie, setCookie } from 'typescript-cookie'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

const CONSENT_MODEL_SHOWN_COOKIE_NAME = 'ludosConsentModalShown'
const MATOMO_CONSENT_COOKIE_NAME = 'mtm_consent'

function isConsentModalAlreadyShown(): boolean {
  return !!getCookie(CONSENT_MODEL_SHOWN_COOKIE_NAME)
}

function rememberConsentModalShown() {
  removeCookie(CONSENT_MODEL_SHOWN_COOKIE_NAME)
  setCookie(CONSENT_MODEL_SHOWN_COOKIE_NAME, Date.now(), { expires: 365, path: '/' })
}

function isMatomoConsentGivenRemembered() {
  return !!getCookie(MATOMO_CONSENT_COOKIE_NAME)
}

function rememberMatomoConsentGiven() {
  const window = globalThis as any
  window._paq = window._paq || []
  window._paq.push(['rememberConsentGiven'])
  window._paq.push(['rememberConsentGiven']) // rememberConsentGiven needs to be called twice to remove mtm_consent_removed
}

function forgetMatomoConsentGiven() {
  const window = globalThis as any
  window._paq = window._paq || []
  window._paq.push(['forgetConsentGiven'])
}

function isTrackingConsentRemembered(): boolean {
  return isMatomoConsentGivenRemembered()
}

function rememberTrackingConsentGiven() {
  rememberMatomoConsentGiven()
}

function forgetTrackingConsentGiven() {
  forgetMatomoConsentGiven()
}

export interface ConsentModalHandles {
  setIsOpen: (isOpen: boolean) => void
}

const ConsentModalComponent: ForwardRefRenderFunction<ConsentModalHandles> = (_, ref) => {
  const { t } = useLudosTranslation()
  const [isOpen, setIsOpen] = useState(!isConsentModalAlreadyShown())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTrackingConsentChecked, setIsTrackingConsentChecked] = useState(isTrackingConsentRemembered())
  const autofocusRef = React.useRef<HTMLButtonElement>(null)

  const resetModal = () => {
    setIsSettingsOpen(false)
    setIsTrackingConsentChecked(isTrackingConsentRemembered())
  }

  const resetAndSetIsOpen = (isOpen: boolean) => {
    resetModal()
    setIsOpen(isOpen)
  }

  useImperativeHandle(ref, () => ({
    setIsOpen: resetAndSetIsOpen
  }))

  useEffect(() => {
    if (isOpen) {
      autofocusRef.current?.focus()
    }
  }, [isOpen])

  const onClose = () => setIsOpen(false)
  const { modalRef, dialogClasses, onAnimEnd } = useModal({ open: isOpen, onClose })
  const margin = 'm-6'

  const onAcceptAll = () => {
    rememberTrackingConsentGiven()

    rememberConsentModalShown()
    resetAndSetIsOpen(false)
  }
  const onAcceptSelected = () => {
    if (isTrackingConsentChecked) {
      rememberTrackingConsentGiven()
    } else {
      forgetTrackingConsentGiven()
    }

    rememberConsentModalShown()
    resetAndSetIsOpen(false)
  }

  return (
    <dialog
      ref={modalRef}
      className={dialogClasses}
      onCancel={(e) => {
        e.preventDefault()
      }}
      onAnimationEnd={onAnimEnd}
      aria-modal="true"
      data-testid="consent-modal">
      <div className={styles['modal__container']}>
        <ModalHeader modalTitle={t('consent.title')} />

        <div className="flex-grow" />

        <p className={margin}>{t('consent.modal.info')}</p>

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
            <input
              type="checkbox"
              id="consent-tracking-checkbox"
              checked={isTrackingConsentChecked}
              readOnly
              onClick={() => setIsTrackingConsentChecked(!isTrackingConsentChecked)}
            />
            <label className="pl-2" htmlFor="consent-tracking-checkbox">
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
            <Button variant="buttonSecondary" onClick={onAcceptSelected} data-testid="accept-all-button">
              {t('consent.modal.accept-selected')}
            </Button>
          )}
          <Button variant="buttonPrimary" onClick={onAcceptAll} data-testid="accept-all-button" ref={autofocusRef}>
            {t('consent.modal.accept-all')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}

export const ConsentModal = forwardRef(ConsentModalComponent)
