import { AllPages, ContentFormAction, NavigationPages, Page, PageHeaders } from '../../types'

export const etusivuKey = 'etusivu'
export const uusiKey = ContentFormAction.uusi
export const muokkausKey = ContentFormAction.muokkaus
export const palautteetKey = 'palautteet'
export const sukoKey = 'suko'
export const puhviKey = 'puhvi'
export const ldKey = 'ld'

export const luvatonKey = 'luvaton'

export const navigationPages: NavigationPages = {
  etusivu: {
    key: `${etusivuKey}`,
    path: `/`
  },
  suko: {
    key: `${sukoKey}`,
    path: `/${sukoKey}`
  },
  ld: {
    key: `${ldKey}`,
    path: `/${ldKey}`
  },
  puhvi: {
    key: `${puhviKey}`,
    path: `/${puhviKey}`
  },
  palautteet: {
    key: `${palautteetKey}`,
    path: `/${palautteetKey}`
  }
}
