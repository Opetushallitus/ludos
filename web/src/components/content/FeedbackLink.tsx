import React from 'react'
import { FEEDBACK_EMAIL } from '../../constants'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { ExternalLink } from '../ExternalLink'

export const FeedbackLink = () => {
  const { t } = useLudosTranslation()

  return (
    <div className="row mb-6 print:hidden">
      <ExternalLink url={FEEDBACK_EMAIL} hideIcon openInNewTab={false} data-testid="tehtava-feedback-link">
        {t('tehtava.palaute')}
      </ExternalLink>
    </div>
  )
}
