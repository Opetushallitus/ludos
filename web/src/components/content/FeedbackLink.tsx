import React from 'react'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { FeedbackEmailLink } from '../FeedbackEmailLink'

export const FeedbackLink = () => {
  const { t } = useLudosTranslation()

  return (
    <div className="row mb-6 print:hidden">
      <FeedbackEmailLink data-testid="tehtava-feedback-link">{t('tehtava.palaute')}</FeedbackEmailLink>
    </div>
  )
}
