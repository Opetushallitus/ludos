import { AllPages, NavigationPages, Page, PageHeaders } from '../../types'

export const frontpageKey = 'etusivu'
export const newKey = 'new'
export const updateKey = 'update'
export const feedbackKey = 'palautteet'
export const sukoKey = 'suko'
export const puhviKey = 'puhvi'
export const ldKey = 'ld'

export const navigationPages: NavigationPages = {
  frontpage: {
    key: `${frontpageKey}`,
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
    key: `${feedbackKey}`,
    path: `/${feedbackKey}`
  }
}

const allPages: AllPages = {
  ...navigationPages,
  create: {
    key: 'lisää uusi koetehtävä',
    path: `/${newKey}`
  }
}
