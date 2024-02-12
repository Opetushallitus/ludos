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
    <div className="mt-5 border-t-2 border-gray-separator pb-4 pt-3" data-testid="footer">
      <div className="flex flex-wrap md:px-10">
        <div className="flex w-full flex-col md:w-3/12">
          <div className="flex justify-center pb-5 pt-3">
            <a href={OPH_URL} target="_blank" rel="noopener noreferrer" title="Opetushallituksen nettisivut">
              <img className="h-12" src={logo} alt="Opetushallituksen logo" />
            </a>
          </div>
        </div>
        {!isPresentation && (
          <>
            <span className="hidden md:flex md:w-1/12 md:flex-col" />
            <div className="mt-3 flex w-1/3 flex-col text-center md:w-2/12 md:text-left">
              <ExternalLink url={feedbackUrl} data-testid="feedback-link">
                {t('footer.palaute')}
              </ExternalLink>
            </div>
            <div className="mt-3 flex w-1/3 flex-col text-center md:w-2/12 md:text-left">
              <ExternalLink url={TIETOSUOJA_SELOSTE_URL}>{t('footer.tietosuoja')}</ExternalLink>
            </div>
            <div className="mt-3 flex w-1/3 flex-col text-center md:w-2/12 md:text-left">
              <ExternalLink url={virkailijanOpintopolkuUrl()}>{t('common.virkailijan-opintopolku')}</ExternalLink>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
