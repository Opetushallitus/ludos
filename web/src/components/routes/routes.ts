import { AllPages, NavigationPages, Page, PageHeaders } from '../../types'

export const frontpageKey = '/etusivu'
export const createKey = '/new'
export const feedbackKey = '/feedback'
export const sukoKey = '/suko'
export const puhviKey = '/puhvi'
export const ldKey = '/ld'
export const examKey = '/exam'

export const navigationPages: NavigationPages = {
  frontpage: {
    title: 'Etusivu',
    path: frontpageKey
  },
  suko: {
    title: 'Suullinen kielitaito',
    path: `${examKey}${sukoKey}`
  },
  puhvi: {
    title: 'Puheviestintä',
    path: `${examKey}${puhviKey}`
  },
  ld: {
    title: 'Lukiodiplomit',
    path: `${examKey}${ldKey}`
  },
  palautteet: {
    title: 'Palautteet',
    path: feedbackKey
  }
}

const allPages: AllPages = {
  ...navigationPages,
  create: {
    title: 'lisää uusi koetehtävä',
    path: createKey
  }
}

export function getPage(key: string): Page | undefined {
  return allPages[key as PageHeaders]
}
