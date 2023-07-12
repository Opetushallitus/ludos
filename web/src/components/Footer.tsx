import { TFunction } from 'i18next'
import logo from 'web/assets/oph_fin_vaaka.png'
import { feedbackKey } from './routes/routes'
import { ExternalLink } from './ExternalLink'
import { InternalLink } from './InternalLink'
import { TIETOSUOJA_SELOSTE_URL } from '../constants'

export const Footer = ({ t }: { t: TFunction }) => (
  <div className="mt-5 border-t-2 border-gray-separator pb-4 pt-3">
    <div className="flex flex-wrap md:px-10">
      <div className="flex w-full flex-col md:w-3/12">
        <div className="flex justify-center pb-5 pt-3">
          <a href="https://oph.fi/">
            <img className="h-12" src={logo} alt="Opetushallitus logo" />
          </a>
        </div>
      </div>
      <span className="hidden md:flex md:w-2/12 md:flex-col" />
      <div className="mt-3 flex w-1/2 flex-col text-center md:w-2/12 md:text-left">
        <InternalLink to={feedbackKey}>{t('footer.palaute')}</InternalLink>
      </div>
      <div className="mt-3 flex w-1/2 flex-col text-center md:w-3/12 md:text-left">
        <ExternalLink url={TIETOSUOJA_SELOSTE_URL}>{t('footer.tietosuoja')}</ExternalLink>
      </div>
    </div>
  </div>
)
