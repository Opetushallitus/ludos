import { TFunction } from 'i18next'

export const FILE_UPLOAD_ERRORS = {
  FILE_TOO_LARGE: 'liian-iso-tiedosto',
  INVALID_FILE_TYPE: 'vaara-tiedostotyyppi'
} as const

export const fileUploadErrorMessage = (error: string, t: TFunction) => {
  // if error is in FILE_UPLOAD_ERRORS then return error message from translation
  if (Object.keys(FILE_UPLOAD_ERRORS).includes(error)) {
    const tKey = error as keyof typeof FILE_UPLOAD_ERRORS

    if (tKey === 'FILE_TOO_LARGE') {
      return t(`error.${FILE_UPLOAD_ERRORS[tKey]}`, { maxSize: '5mb' })
    }

    return t(`error.${FILE_UPLOAD_ERRORS[tKey]}`)
  } else {
    return t('error.lataaminen-epaonnistui')
  }
}
