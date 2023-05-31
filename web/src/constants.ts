export const baseApiUrl = '/api'
export const assignmentUrl = `${baseApiUrl}/assignment`
export const instructionUrl = `${baseApiUrl}/instruction`
export const certificateUrl = `${baseApiUrl}/certificate`
export const logoutUrl = `${baseApiUrl}/logout`
export const MOBILE_BREAKPOINT = '768px'
export const IS_MOBILE_QUERY = `screen and (max-width: ${MOBILE_BREAKPOINT})`
export const TIETOSUOJA_SELOSTE_URL = 'https://opintopolku.fi/konfo/fi/sivu/tietosuojaselosteet-ja-evasteet'

export const EXAM_TYPE_ENUM = {
  ASSIGNMENT: 'assignment',
  INSTRUCTION: 'instruction',
  CERTIFICATE: 'certificate'
}
