import React from 'react'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { FeedbackEmailLink } from '../FeedbackEmailLink'

export const FeedbackLink = () => {
  const { t } = useLudosTranslation()
  const subject = `Palautetta tehtävästä: ${window.location.href}`

  return (
    <div className="row mb-6 print:hidden">
      <FeedbackEmailLink subject={subject} data-testid="tehtava-feedback-link">
        {t('tehtava.palaute')}
      </FeedbackEmailLink>
    </div>
  )
}
