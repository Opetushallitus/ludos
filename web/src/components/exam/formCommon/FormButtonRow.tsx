import { useTranslation } from 'react-i18next'
import { Button } from '../../Button'
import { Icon } from '../../Icon'
import { useNavigate } from 'react-router-dom'
import { PublishState } from '../../../types'

type FormButtonRowProps = {
  actions: {
    onSubmitClick: () => Promise<void>
    onSaveDraftClick: () => Promise<void>
  }
  state: {
    isUpdate: boolean
    isLoading: boolean
    publishState?: PublishState
  }
  notValidFormMessageKey: string
  errorMessage?: string
}

export const FormButtonRow = ({ actions, state, notValidFormMessageKey, errorMessage }: FormButtonRowProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isUpdate, isLoading } = state
  const isDraft = state.publishState === PublishState.Draft

  // todo: siirrä useLudosTranslation hookkiin
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
    <>
      <div className="row mt-4 flex-wrap justify-center gap-3 md:justify-end">
        <Button
          variant="buttonGhost"
          type="button"
          onClick={() => navigate(-1)}
          disabled={isLoading}
          data-testid="form-cancel">
          {t('button.peruuta')}
        </Button>
        <Button
          variant="buttonSecondary"
          type="button"
          onClick={actions.onSaveDraftClick}
          disabled={isLoading}
          data-testid={isUpdate ? 'form-update-draft' : 'form-draft'}>
          {draftButtonText()}
        </Button>
        <Button
          variant="buttonPrimary"
          type="button"
          onClick={actions.onSubmitClick}
          disabled={isLoading}
          data-testid={isUpdate ? 'form-update-submit' : 'form-submit'}>
          {submitButtonText()}
        </Button>
      </div>
      {notValidFormMessageKey && (
        <div className="flex justify-end text-red-primary gap-1">
          <Icon name="virheellinen" color="text-red-primary" />
          {t(notValidFormMessageKey)}
          {t('form.tayta-pakolliset-kentat')}
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
    </>
  )
}
