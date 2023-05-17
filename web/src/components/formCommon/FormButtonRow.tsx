import { useTranslation } from 'react-i18next'
import { Button } from '../Button'

export const FormButtonRow = ({
  onCancelClick,
  onSubmitClick,
  onSaveDraftClick
}: {
  onCancelClick: () => void
  onSaveDraftClick: () => Promise<void>
  onSubmitClick: () => Promise<void>
}) => {
  const { t } = useTranslation()

  return (
    <div className="row mt-4 flex-wrap justify-center gap-3 md:justify-end">
      <Button variant="buttonGhost" type="button" onClick={onCancelClick} testId="form-cancel">
        {t('button.peruuta')}
      </Button>
      <Button variant="buttonSecondary" type="button" onClick={onSaveDraftClick} testId="form-draft">
        {t('button.tallennaluonnos')}
      </Button>
      <Button variant="buttonPrimary" type="button" onClick={onSubmitClick} testId="form-submit">
        {t('button.tallennajulkaise')}
      </Button>
    </div>
  )
}
