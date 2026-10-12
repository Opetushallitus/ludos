import { useLudosTranslation } from '../../hooks/useLudosTranslation'
import { Button } from '../Button'

export const PrintButton = () => {
  const { t } = useLudosTranslation()

  function print() {
    window.print()
  }

  return (
    <div id="print-button" className="row mb-3 print:hidden">
      <Button variant="buttonPrimary" customClass="rounded-none px-6 py-3 inline-block" onClick={print}>
        {t('tehtava.tulosta')}
      </Button>
    </div>
  )
}
