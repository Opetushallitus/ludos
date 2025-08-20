import { twJoin } from 'tailwind-merge'
import { virkailijanOpintopolkuUrl } from '../../constants'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { ExternalLink } from '../ExternalLink'
import { Icon } from '../Icon'

export const HeaderApplicationMenu = ({ showBorder = false }: { showBorder?: boolean }) => {
  const { t } = useLudosTranslation()
  return (
    <>
      <div
        className={twJoin('pl-4 py-2', showBorder && 'border-t-2 border-gray-separator')}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-menu"
      >
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
          data-testid="footer-virkailijan-opintopolku-link"
        >
          {t('common.virkailijan-opintopolku')}
        </ExternalLink>
      </div>
    </>
  )
}
