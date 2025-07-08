import React from 'react'
import { useFeedbackUrl } from '../../hooks/useFeedbackUrl'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { ExternalLink } from '../ExternalLink'

export const FeedbackLink = () => {
  const { t } = useLudosTranslation()
  const feedbackUrl = useFeedbackUrl()

  return (
    <div className="row mb-6 print:hidden">
      <ExternalLink url={feedbackUrl} data-testid="tehtava-feedback-link">
        {t('tehtava.palaute')}
      </ExternalLink>
    </div>
  )
}
