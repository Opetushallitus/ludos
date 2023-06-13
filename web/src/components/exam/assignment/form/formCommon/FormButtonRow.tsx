import { useTranslation } from 'react-i18next'
import { Button } from '../../../../Button'

export const FormButtonRow = ({
  onCancelClick,
  onSubmitClick,
  onSaveDraftClick,
  isLoading
}: {
  onCancelClick: () => void
  onSaveDraftClick: () => Promise<void>
  onSubmitClick: () => Promise<void>
  isLoading?: boolean
}) => {
  const { t } = useTranslation()

  return (
    <div className="row mt-4 flex-wrap justify-center gap-3 md:justify-end">
      <Button variant="buttonGhost" type="button" onClick={onCancelClick} disabled={isLoading} testId="form-cancel">
        {t('button.peruuta')}
      </Button>
      <Button
        variant="buttonSecondary"
        type="button"
        onClick={onSaveDraftClick}
        disabled={isLoading}
        testId="form-draft">
        {t('button.tallennaluonnos')}
      </Button>
      <Button variant="buttonPrimary" type="button" onClick={onSubmitClick} disabled={isLoading} testId="form-submit">
        {t('button.tallennajulkaise')}
      </Button>
    </div>
  )
}
