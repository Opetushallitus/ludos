import { Button } from '../../Button'
import { Icon } from '../../Icon'
import { useNavigate } from 'react-router-dom'
import { PublishState } from '../../../types'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'

type FormButtonRowProps = {
  actions: {
    onSubmitClick: () => void
    onSaveDraftClick: () => void
    onDeleteClick: () => void
  }
  state: {
    isUpdate: boolean
    isSubmitting: boolean
    publishState?: PublishState
  }
  formHasValidationErrors: boolean
  errorMessage?: string
}

export const FormButtonRow = ({ actions, state, formHasValidationErrors, errorMessage }: FormButtonRowProps) => {
  const { t } = useLudosTranslation()
  const navigate = useNavigate()
  const { isUpdate, isSubmitting } = state
  const isDraft = state.publishState === PublishState.Draft

  const draftButtonText = () => {
    if (!isUpdate) {
      return t('button.tallennaluonnos')
    }

    if (isDraft) {
      return t('button.tallenna')
    } else {
      return t('button.palauta-luonnostilaan')
    }
  }

  const submitButtonText = () => {
    if (!isUpdate) {
      return t('button.tallennajulkaise')
    }

    if (isDraft) {
      return t('button.tallennajulkaise')
    } else {
      return t('button.tallenna')
    }
  }

  return (
    <div className="row mt-4 justify-center md:justify-between flex-wrap-reverse">
      <div className="flex md:w-1/2">
        {state.isUpdate && (
          <Button
            variant="buttonDanger"
            onClick={actions.onDeleteClick}
            disabled={isSubmitting}
            data-testid="form-delete">
            {t('form.button.poista')}
          </Button>
        )}
      </div>
      <div className="flex justify-center flex-wrap-reverse gap-4 py-2 md:py-0 md:w-1/2 md:justify-end">
        <Button
          variant="buttonGhost"
          // fixme: voiko tästä tulla ongelmia jos joku navigoi /uusi sivulle suoraan eri sivustolta?
          onClick={() => navigate(-1)}
          customClass="w-full md:w-auto"
          disabled={isSubmitting}
          data-testid="form-cancel">
          {t('button.peruuta')}
        </Button>
        <Button
          variant="buttonSecondary"
          customClass="w-full md:w-auto"
          disabled={isSubmitting}
          onClick={actions.onSaveDraftClick}
          data-testid="form-draft">
          {draftButtonText()}
        </Button>
        <Button
          variant="buttonPrimary"
          onClick={actions.onSubmitClick}
          customClass="w-full md:w-auto"
          disabled={isSubmitting}
          data-testid="form-submit">
          {submitButtonText()}
        </Button>
      </div>
      {formHasValidationErrors && (
        <div className="flex justify-end text-red-primary gap-1">
          <Icon name="virheellinen" color="text-red-primary" />
          {t('form.error.validaatiovirhe')}
        </div>
      )}
      {errorMessage && (
        <div className="flex justify-end">
          <ul className="min-w-36 mt-4 max-w-2xl text-red-primary">
            {errorMessage.split('\n').map((e, i) => (
              <li className="list-disc" key={i}>
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
