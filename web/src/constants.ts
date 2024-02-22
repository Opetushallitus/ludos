export const OPH_URL = 'https://oph.fi/'
export const FEEDBACK_BASE_URL = 'https://laatutyokalut.suomi.fi/p/hcTd'
export const BASE_API_URL = '/api'
export const ASSIGNMENT_URL = `${BASE_API_URL}/assignment`
export const INSTRUCTION_URL = `${BASE_API_URL}/instruction`
export const CERTIFICATE_URL = `${BASE_API_URL}/certificate`
export const LOGOUT_URL = `${BASE_API_URL}/logout`
export const MOBILE_BREAKPOINT = '768px'
export const LARGE_SCREEN_BREAKPOINT = '991px'
export const IS_MOBILE_QUERY = `screen and (max-width: ${MOBILE_BREAKPOINT})`
export const TIETOSUOJA_SELOSTE_URL = 'https://opintopolku.fi/konfo/fi/sivu/tietosuojaselosteet-ja-evasteet'
export const DOWNLOAD_CERTIFICATE_ATTACHMENT_URL = `${CERTIFICATE_URL}/attachment`
export const DOWNLOAD_INSTRUCTION_ATTACHMENT_URL = `${INSTRUCTION_URL}/attachment`

export function virkailijanOpintopolkuUrl() {
  if (window?.location?.hostname?.match(/^ludos\.[^.]*opintopolku\.fi$/)) {
    const virkailijaHostname = window.location.hostname.replace(/^ludos\./, 'virkailija.')
    return `https://${virkailijaHostname}/`
  } else {
    return 'https://virkailija.opintopolku.fi/'
  }
}

export const FAVORITE_ROOT_FOLDER_ID = 0
