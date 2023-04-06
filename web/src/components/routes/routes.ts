import { AllPages, NavigationPages, Page, PageHeaders } from '../../types'

export const frontpageKey = 'etusivu'
export const createKey = 'new'
export const feedbackKey = 'feedback'
export const sukoKey = 'suko'
export const puhviKey = 'puhvi'
export const ldKey = 'ld'
export const contentKey = 'content'

export const navigationPages: NavigationPages = {
  frontpage: {
    title: 'Etusivu',
    path: `/${frontpageKey}`
  },
  suko: {
    title: 'Suullinen kielitaito',
    path: `/${contentKey}/${sukoKey}`
  },
  puhvi: {
    title: 'Puheviestintä',
    path: `/${contentKey}/${puhviKey}`
  },
  ld: {
    title: 'Lukiodiplomit',
    path: `/${contentKey}/${ldKey}`
  },
  palautteet: {
    title: 'Palautteet',
    path: `/${feedbackKey}`
  }
}

const allPages: AllPages = {
  ...navigationPages,
  create: {
    title: 'lisää uusi koetehtävä',
    path: `/${createKey}`
  }
}

export function getPage(key: string): Page | undefined {
  return allPages[key as PageHeaders]
}
