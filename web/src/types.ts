export type Page = {
  title: string
  path: string
}

export const EXAM_TYPES = ['suko', 'puhvi', 'ld']

export const PAGE_HEADERS = ['frontpage', ...EXAM_TYPES, 'palautteet'] as const

export type PageHeaders = (typeof PAGE_HEADERS)[number]

export type NavigationPages = Record<PageHeaders, Page>

export type AllPages = NavigationPages & {
  create: Page
}

export const AssignmentState = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Archived: 'ARCHIVED'
} as const

export type AssignmentState = (typeof AssignmentState)[keyof typeof AssignmentState]

export const ExamType = {
  Suko: 'SUKO',
  Puhvi: 'PUHVI',
  Ld: 'LD'
} as const

export type ExamType = (typeof ExamType)[keyof typeof ExamType]

export type AssignmentIn = {
  id: number
  name: string
  content: string
  state: AssignmentState
  assignmentType: string
  createdAt: string
  updatedAt: string
}

export const AssignmentTypes = {
  KOETEHTAVAT: 'koetehtävät',
  OHJEET: 'ohjeet',
  TODISTUKSET: 'todistukset'
} as const

export type AssignmentsKey = keyof typeof AssignmentTypes

type SingularOptions = {
  [key in AssignmentsKey]: string
}

export const AssignmentsSingular: SingularOptions = {
  KOETEHTAVAT: 'koetehtävä',
  OHJEET: 'ohje',
  TODISTUKSET: 'todistus'
}

export type AssignmentType = (typeof AssignmentTypes)[keyof typeof AssignmentTypes]
