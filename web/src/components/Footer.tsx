import logo from '../../assets/oph_fin_vaaka.png'
import { ExternalLink } from './ExternalLink'
import { OPH_URL, TIETOSUOJA_SELOSTE_URL, virkailijanOpintopolkuUrl } from '../constants'
import { useFeedbackUrl } from '../hooks/useFeedbackUrl'
import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { ConsentModal, ConsentModalHandles } from './modal/ConsentModal'
import { Button } from './Button'
import { useRef } from 'react'

type FooterProps = {
  isPresentation?: boolean
}

export const Footer = ({ isPresentation }: FooterProps) => {
  const { t } = useLudosTranslation()
  const feedbackUrl = useFeedbackUrl()
  const consentModalRef = useRef<ConsentModalHandles>(null)

  return (
    <div
      className="row flex-wrap items-center text-xs mt-5 py-4 px-10 border-t-2 border-gray-separator"
      data-testid="footer">
      <ConsentModal ref={consentModalRef} />
      <div className="w-full md:w-1/3">
        <a href={OPH_URL} target="_blank" rel="noopener noreferrer" title="Opetushallituksen nettisivut">
          <img className="h-12" src={logo} alt="Opetushallituksen logo" />
        </a>
      </div>
      {!isPresentation && (
        <div className="flex flex-wrap w-full md:w-2/3 justify-evenly gap-5 mt-3 text-center md:text-left">
          <ExternalLink url={feedbackUrl} data-testid="feedback-link">
            {t('footer.palaute')}
          </ExternalLink>
          <ExternalLink url={t('footer.kayttoohjeet-url')} data-testid="kayttoohjeet-link">
            {t('footer.kayttoohjeet')}
          </ExternalLink>
          <ExternalLink url={virkailijanOpintopolkuUrl()}>{t('common.virkailijan-opintopolku')}</ExternalLink>
          <ExternalLink url={TIETOSUOJA_SELOSTE_URL}>{t('footer.tietosuoja')}</ExternalLink>
          <Button
            variant="buttonGhost"
            className={'text-green-primary hover:underline'}
            onClick={() => consentModalRef.current?.setIsOpen(true)}
            data-testid="privacy-settings-button">
            {t('consent.title')}
          </Button>
        </div>
      )}
    </div>
  )
}
