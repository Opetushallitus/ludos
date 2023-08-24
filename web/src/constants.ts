export const BASE_API_URL = '/api'
export const ASSIGNMENT_URL = `${BASE_API_URL}/assignment`
export const INSTRUCTION_URL = `${BASE_API_URL}/instruction`
export const CERTIFICATE_URL = `${BASE_API_URL}/certificate`
export const LOGOUT_URL = `${BASE_API_URL}/logout`
export const MOBILE_BREAKPOINT = '768px'
export const IS_MOBILE_QUERY = `screen and (max-width: ${MOBILE_BREAKPOINT})`
export const TIETOSUOJA_SELOSTE_URL = 'https://opintopolku.fi/konfo/fi/sivu/tietosuojaselosteet-ja-evasteet'
export const DOWNLOAD_CERTIFICATE_ATTACHMENT_URL = `${CERTIFICATE_URL}/attachment`
export const DOWNLOAD_INSTRUCTION_ATTACHMENT_URL = `${INSTRUCTION_URL}/attachment`

export const EXAM_TYPE_ENUM = {
  ASSIGNMENT: 'assignment',
  INSTRUCTION: 'instruction',
  CERTIFICATE: 'certificate'
}
