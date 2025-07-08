import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { ErrorMessages, ErrorMessagesType } from '../../../types'
import { MIN_NAME_LENGTH } from '../schemas/schemaCommon'

export const FormError = ({ error, name }: { error?: string; name: string }) => {
  const { t } = useLudosTranslation()

  function getErrorMessage(errorMsg: ErrorMessagesType) {
    switch (errorMsg) {
      case ErrorMessages.SHORT:
        return t('error.liian-lyhyt', { min: MIN_NAME_LENGTH })
      case ErrorMessages.REQUIRED:
        return t('error.pakollinen-tieto')
      case ErrorMessages.REQUIRED_IMG_ALT:
        return t('error.kuvan-vaihtoehtoinen-teksti-pakollinen')
      case ErrorMessages.NO_FILE:
        return t('error.ei-tiedostoa')
      case ErrorMessages.ASSIGNMENT_NAME_REQUIRED:
        return t('error.tehtavan-nimi-pakollinen')
      default:
        return ''
    }
  }

  if (error) {
    return (
      <p className="text-red-primary" data-testid={`error-message-${name}`}>
        {getErrorMessage(error as ErrorMessagesType)}
      </p>
    )
  } else {
    return null
  }
}
