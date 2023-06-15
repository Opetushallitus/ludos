import { useTranslation } from 'react-i18next'
import { ErrorMessages, ErrorMessagesType } from '../../../../../types'
import { MIN_LENGTH } from '../assignmentSchema'

export const FormError = ({ error }: { error?: string }) => {
  const { t } = useTranslation()

  function getErrorMessage(errorMsg: ErrorMessagesType) {
    switch (errorMsg) {
      case ErrorMessages.SHORT:
        return t('error.liian-lyhyt', { min: MIN_LENGTH })
      case ErrorMessages.REQUIRED:
        return t('error.pakollinen-tieto')
      default:
        return ''
    }
  }

  return <>{error && <p className="text-red">{getErrorMessage(error as ErrorMessagesType)}</p>}</>
}
