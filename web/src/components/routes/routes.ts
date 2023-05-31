import { AllPages, NavigationPages, Page, PageHeaders } from '../../types'

export const frontpageKey = 'etusivu'
export const newKey = 'new'
export const updateKey = 'update'
export const feedbackKey = 'feedback'
export const sukoKey = 'suko'
export const puhviKey = 'puhvi'
export const ldKey = 'ld'

export const navigationPages: NavigationPages = {
  frontpage: {
    titleKey: 'etusivu',
    path: `/${frontpageKey}`
  },
  suko: {
    titleKey: 'suko',
    path: `/${sukoKey}`
  },
  ld: {
    titleKey: 'ld',
    path: `/${ldKey}`
  },
  puhvi: {
    titleKey: 'puhvi',
    path: `/${puhviKey}`
  },
  palautteet: {
    titleKey: 'palautteet',
    path: `/${feedbackKey}`
  }
}

const allPages: AllPages = {
  ...navigationPages,
  create: {
    titleKey: 'lisää uusi koetehtävä',
    path: `/${newKey}`
  }
}

export function getPage(key: string): Page | undefined {
  return allPages[key as PageHeaders]
}
