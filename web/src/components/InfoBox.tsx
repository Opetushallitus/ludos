import { Icon } from './Icon'
import { Trans, useTranslation } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { InternalLink } from './InternalLink'
import { palautteetKey } from './LudosRoutes'

type InfoBoxProps = {
  type: 'info' | 'error'
  i18nKey: string
}

export const InfoBox = ({ type, i18nKey }: InfoBoxProps) => {
  const { t } = useTranslation()
  const isError = type === 'error'

  return (
    <div
      className={twMerge(
        'flex items-center py-2 px-5 mt-10 rounded',
        isError ? 'bg-red-primary text-white' : 'bg-gray-bg'
      )}>
      <Icon
        customClass="pr-3"
        name={isError ? 'virhe' : 'info'}
        color={isError ? 'text-white' : 'text-black'}
        filled={isError}
        size="lg"
      />
      <p className="flex-grow">
        <Trans i18nKey={i18nKey} />
        {isError && (
          <InternalLink className="ml-1 text-white underline" to={`/${palautteetKey}`}>
            {t('notification.error.link.laheta-palautetta-virheesta')}
          </InternalLink>
        )}
      </p>
    </div>
  )
}
