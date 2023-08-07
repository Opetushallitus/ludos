import { useTranslation } from 'react-i18next'
import { ErrorMessages, ErrorMessagesType } from '../../../types'
import { MIN_LENGTH } from '../assignment/form/assignmentSchema'

export const FormError = ({ error }: { error?: string }) => {
  const { t } = useTranslation()

  function getErrorMessage(errorMsg: ErrorMessagesType) {
    switch (errorMsg) {
      case ErrorMessages.SHORT:
        return t('error.liian-lyhyt', { min: MIN_LENGTH })
      case ErrorMessages.REQUIRED:
        return t('error.pakollinen-tieto')
      case 'no_file':
        return t('error.ei-tiedostoa')
      default:
        return ''
    }
  }

  return <>{error && <p className="text-red-primary">{getErrorMessage(error as ErrorMessagesType)}</p>}</>
}
