import { useTranslation } from 'react-i18next'
import { ErrorMessages, ErrorMessagesType } from '../../../types'

import { MIN_NAME_LENGTH } from '../schemas/schemaCommon'

export const FormError = ({ error }: { error?: string }) => {
  const { t } = useTranslation()

  function getErrorMessage(errorMsg: ErrorMessagesType) {
    switch (errorMsg) {
      case ErrorMessages.SHORT:
        return t('error.liian-lyhyt', { min: MIN_NAME_LENGTH })
      case ErrorMessages.REQUIRED:
        return t('error.pakollinen-tieto')
      case ErrorMessages.NO_FILE:
        return t('error.ei-tiedostoa')
      case ErrorMessages.ASSIGNMENT_NAME_REQUIRED:
        return t('error.tehtavan-nimi-pakollinen')
      default:
        return ''
    }
  }

  return <>{error && <p className="text-red-primary">{getErrorMessage(error as ErrorMessagesType)}</p>}</>
}
