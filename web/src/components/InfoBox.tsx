import { Trans } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { useLudosTranslation } from '../hooks/useLudosTranslation'
import { FeedbackEmailLink } from './FeedbackEmailLink'
import { Icon } from './Icon'

type InfoBoxProps = {
  type: 'info' | 'error'
  i18nKey: string
}

export const InfoBox = ({ type, i18nKey }: InfoBoxProps) => {
  const { t } = useLudosTranslation()
  const isError = type === 'error'

  return (
    <div
      className={twMerge(
        'flex items-center py-2 px-5 mt-10 rounded',
        isError ? 'bg-red-primary text-white' : 'bg-gray-bg'
      )}
    >
      <Icon
        customClass="pr-3"
        name={isError ? 'virhe' : 'info'}
        color={isError ? 'text-white' : 'text-black'}
        size="lg"
      />
      <p className="flex-grow">
        <Trans i18nKey={i18nKey} />
        {isError && (
          <FeedbackEmailLink className="ml-1 underline" textColor="text-white">
            {t('notification.error.link.laheta-palautetta-virheesta')}
          </FeedbackEmailLink>
        )}
      </p>
    </div>
  )
}
