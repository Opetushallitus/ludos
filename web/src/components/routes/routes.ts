import { AllPages, NavigationPages, Page, PageHeaders } from '../../types'
export const frontpageKey = '/'
export const assignmentsKey = '/assignments'
export const createKey = '/create'
export const instructionsKey = '/instructions'
export const certificatesKey = '/certificates'
export const feedbackKey = '/feedback'

export const navigationPages: NavigationPages = {
  frontpage: {
    title: 'etusivu',
    path: frontpageKey
  },
  assignments: {
    title: 'koetehtävät',
    path: assignmentsKey
  },
  instructions: {
    title: 'ohjeet',
    path: instructionsKey
  },
  certificates: {
    title: 'todistukset',
    path: certificatesKey
  },
  feedback: {
    title: 'palautteet',
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
