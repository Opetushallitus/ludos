import React from 'react'
import { ExternalLink } from '../ExternalLink'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { useFeedbackUrl } from '../../hooks/useFeedbackUrl'

export const FeedbackLink = () => {
  const { t } = useLudosTranslation()
  const feedbackUrl = useFeedbackUrl()

  return (
    <div className="row mb-6">
      <ExternalLink url={feedbackUrl} data-testid="tehtava-feedback-link">
        {t('tehtava.palaute')}
      </ExternalLink>
    </div>
  )
}
