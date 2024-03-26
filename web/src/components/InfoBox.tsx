import { Icon } from './Icon'
import { Trans } from 'react-i18next'
import { twMerge } from 'tailwind-merge'
import { useFeedbackUrl } from '../hooks/useFeedbackUrl'
import { ExternalLink } from './ExternalLink'
import { useLudosTranslation } from '../hooks/useLudosTranslation'

type InfoBoxProps = {
  type: 'info' | 'error'
  i18nKey: string
}

export const InfoBox = ({ type, i18nKey }: InfoBoxProps) => {
  const { t } = useLudosTranslation()
  const feedbackUrl = useFeedbackUrl()
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
        size="lg"
      />
      <p className="flex-grow">
        <Trans i18nKey={i18nKey} />
        {isError && (
          <ExternalLink className="ml-1 underline" textColor="text-white" url={feedbackUrl}>
            {t('notification.error.link.laheta-palautetta-virheesta')}
          </ExternalLink>
        )}
      </p>
    </div>
  )
}
