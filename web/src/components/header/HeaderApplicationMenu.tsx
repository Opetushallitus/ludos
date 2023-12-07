import { Icon } from '../Icon'
import { ExternalLink } from '../ExternalLink'
import { virkailijanOpintopolkuUrl } from '../../constants'
import { useTranslation } from 'react-i18next'
import { twJoin } from 'tailwind-merge'

export const HeaderApplicationMenu = ({ showBorder = false }: { showBorder?: boolean }) => {
  const { t } = useTranslation()
  return (
    <>
      <div
        className={twJoin('pl-4 py-2', showBorder && 'border-t-2 border-gray-separator')}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-menu">
        <p className="font-semibold">{t('header.vaihda-sovellusta')}</p>
      </div>
      <div className="row gap-2 items-center pl-4" role="menuitem">
        <span className="flex items-center w-4">
          <Icon name="check" size="lg" color="text-black" />
        </span>
        <p>{t('title.ludos')}</p>
      </div>
      <div className="row gap-2 items-center pl-4" role="menuitem">
        <span className="w-4" />
        <ExternalLink
          url={virkailijanOpintopolkuUrl()}
          className="py-2"
          openInNewTab={false}
          data-testid="footer-virkailijan-opintopolku-link">
          {t('common.virkailijan-opintopolku')}
        </ExternalLink>
      </div>
    </>
  )
}
