import { useTranslation } from 'react-i18next'
import { Button } from '../../Button'

export const FormButtonRow = ({
  onCancelClick,
  onSubmitClick,
  onSaveDraftClick,
  errorMessage,
  isLoading
}: {
  onCancelClick: () => void
  onSaveDraftClick: () => Promise<void>
  onSubmitClick: () => Promise<void>
  errorMessage?: string
  isLoading?: boolean
}) => {
  const { t } = useTranslation()

  return (
    <>
      <div className="row mt-4 flex-wrap justify-center gap-3 md:justify-end">
        <Button
          variant="buttonGhost"
          type="button"
          onClick={onCancelClick}
          disabled={isLoading}
          data-testid="form-cancel">
          {t('button.peruuta')}
        </Button>
        <Button
          variant="buttonSecondary"
          type="button"
          onClick={onSaveDraftClick}
          disabled={isLoading}
          data-testid="form-draft">
          {t('button.tallennaluonnos')}
        </Button>
        <Button
          variant="buttonPrimary"
          type="button"
          onClick={onSubmitClick}
          disabled={isLoading}
          data-testid="form-submit">
          {t('button.tallennajulkaise')}
        </Button>
      </div>
      {errorMessage && (
        <div className="flex justify-end">
          <ul className="min-w-36 mt-4 max-w-2xl text-red-primary">
            {errorMessage.split('\n').map((e) => (
              <li className="list-disc">{e}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
