import React from 'react'
import { useLudosTranslation } from '../../hooks/useLudosTranslation'

export const PrintButton = () => {
  const { t } = useLudosTranslation()

  function print() {
    window.print()
  }

  return (
    <div id="print-button" className="row mb-3">
      <button onClick={print} className="text-green-primary buttonPrimary px-6 py-3 inline-block print:hidden">
        {t('tehtava.tulosta')}
      </button>
    </div>
  )
}
