import { AllPages, NavigationPages, Page, PageHeaders } from '../../types'
export const frontpageKey = '/'
export const assignmentsKey = '/assignments'
export const createKey = '/new'
export const instructionsKey = '/instructions'
export const certificatesKey = '/certificates'
export const feedbackKey = '/feedback'
export const sukoKey = '/suko'
export const puhviKey = '/puhvi'
export const ldKey = '/ld'

export const navigationPages: NavigationPages = {
  frontpage: {
    title: 'Etusivu',
    path: frontpageKey
  },
  suko: {
    title: 'Suullinen kielitaito',
    path: sukoKey
  },
  puhvi: {
    title: 'Puheviestintä',
    path: puhviKey
  },
  ld: {
    title: 'Lukiodiplomit',
    path: ldKey
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
