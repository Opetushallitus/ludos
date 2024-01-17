import { Button } from '../../Button'
import { Icon } from '../../Icon'
import { FetchErrorMessages, PublishState } from '../../../types'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { ExternalLink } from '../../ExternalLink'
import { uudelleenkirjautuminenOnnistuiPath } from '../../LudosRoutes'

type FormButtonRowProps = {
  actions: {
    onSubmitClick: () => void
    onSaveDraftClick: () => void
    onDeleteClick: () => void
    onCancelClick: () => void
  }
  state: {
    isUpdate: boolean
    disableSubmit: boolean
    publishState?: PublishState
  }
  formHasValidationErrors: boolean
  errorMessage?: string
}

export const FormButtonRow = ({ actions, state, formHasValidationErrors, errorMessage }: FormButtonRowProps) => {
  const { t } = useLudosTranslation()
  const { isUpdate, disableSubmit } = state
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

  const showErrorMessage = (e: string) => {
    if (e === FetchErrorMessages.SessionExpired) {
      return (
        <div data-testid="session-expired-error-message">
          {t('notification.error.istunto-vanhentunut')}
          <ExternalLink
            className="underline"
            textColor="text-red-primary"
            url={uudelleenkirjautuminenOnnistuiPath}
            data-testid="link">
            {t('notification.error.istunto-vanhentunut-uudelleenkirjautuminen-linkki')}
          </ExternalLink>
        </div>
      )
    }

    return e
  }

  return (
    <div className="row mt-4 justify-center md:justify-between flex-wrap-reverse">
      <div className="flex md:w-1/3">
        {state.isUpdate && (
          <Button
            variant="buttonDanger"
            onClick={actions.onDeleteClick}
            disabled={disableSubmit}
            data-testid="form-delete">
            {t('form.button.poista')}
          </Button>
        )}
      </div>
      <div className="flex justify-center flex-wrap-reverse gap-4 py-2 md:py-0 md:w-2/3 md:justify-end">
        <Button
          variant="buttonGhost"
          onClick={actions.onCancelClick}
          customClass="w-full md:w-auto"
          disabled={disableSubmit}
          data-testid="form-cancel">
          {t('button.peruuta')}
        </Button>
        <Button
          variant="buttonSecondary"
          customClass="w-full md:w-auto"
          disabled={disableSubmit}
          onClick={actions.onSaveDraftClick}
          data-testid="form-draft">
          {draftButtonText()}
        </Button>
        <Button
          variant="buttonPrimary"
          onClick={actions.onSubmitClick}
          customClass="w-full md:w-auto"
          disabled={disableSubmit}
          data-testid="form-submit">
          {submitButtonText()}
        </Button>
      </div>
      {formHasValidationErrors && (
        <div className="flex justify-end text-red-primary gap-1 mb-2">
          <Icon name="virheellinen" color="text-red-primary" />
          {t('form.error.validaatiovirhe')}
        </div>
      )}
      {errorMessage && (
        <div className="flex justify-end mb-5">
          <ul className="min-w-36 mt-4 max-w-2xl text-red-primary">
            {errorMessage.split('\n').map((e, i) => (
              <li className="list-disc" key={i}>
                {showErrorMessage(e)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
