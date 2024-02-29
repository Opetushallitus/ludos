import logo from 'web/assets/oph_fin_vaaka.png'
import { ExternalLink } from './ExternalLink'
import { OPH_URL, TIETOSUOJA_SELOSTE_URL, virkailijanOpintopolkuUrl } from '../constants'
import { useTranslation } from 'react-i18next'
import { useFeedbackUrl } from '../hooks/useFeedbackUrl'

type FooterProps = {
  isPresentation?: boolean
}

export const Footer = ({ isPresentation }: FooterProps) => {
  const { t } = useTranslation()
  const feedbackUrl = useFeedbackUrl()

  return (
    <div
      className="flex flex-wrap items-center justify-between text-xs mt-5 py-4 px-10 border-t-2 border-gray-separator"
      data-testid="footer">
      <a href={OPH_URL} target="_blank" rel="noopener noreferrer" title="Opetushallituksen nettisivut">
        <img className="h-12" src={logo} alt="Opetushallituksen logo" />
      </a>
      {!isPresentation && (
        <div className="row flex-wrap gap-10 mt-3 text-center md:text-left">
          <div>
            <ExternalLink url={feedbackUrl} data-testid="feedback-link">
              {t('footer.palaute')}
            </ExternalLink>
            <ExternalLink url={t('footer.kayttoohjeet-url')} data-testid="kayttoohjeet-link">
              {t('footer.kayttoohjeet')}
            </ExternalLink>
          </div>
          <div>
            <ExternalLink url={virkailijanOpintopolkuUrl()}>{t('common.virkailijan-opintopolku')}</ExternalLink>
            <ExternalLink url={TIETOSUOJA_SELOSTE_URL}>{t('footer.tietosuoja')}</ExternalLink>
          </div>
        </div>
      )}
    </div>
  )
}
