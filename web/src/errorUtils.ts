export const FILE_UPLOAD_ERRORS = {
  FILE_TOO_LARGE: 'liian-iso-tiedosto',
  INVALID_FILE_TYPE: 'vaara-tiedostotyyppi'
} as const

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  } else if (typeof error === 'string') {
    return error
  } else {
    return 'An error occurred'
  }
}
