export type Page = {
  titleKey: string
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

export const Exam = {
  Suko: 'SUKO',
  Puhvi: 'PUHVI',
  Ld: 'LD'
} as const

export type Exam = (typeof Exam)[keyof typeof Exam]

export type AssignmentIn = {
  id: number
  nameFi: string
  nameSv: string
  contentFi: string
  contentSv: string
  state: AssignmentState
  contentType: Exam
  createdAt: string
  updatedAt: string
}

export type SukoAssignmentIn = AssignmentIn & {
  assignmentType: string
}

export const ContentTypes = {
  KOETEHTAVAT: 'koetehtavat',
  OHJEET: 'ohjeet',
  TODISTUKSET: 'todistukset'
} as const

export const ContentTypesEng = {
  KOETEHTAVAT: 'assignments',
  OHJEET: 'instructions',
  TODISTUKSET: 'certificates'
}

export type ContentTypeKeys = keyof typeof ContentTypes

type SingularOptions = {
  [key in ContentTypeKeys]: string
}

export const ContentTypesSingular: SingularOptions = {
  KOETEHTAVAT: 'koetehtava',
  OHJEET: 'ohje',
  TODISTUKSET: 'todistus'
}

export type ContentType = (typeof ContentTypes)[keyof typeof ContentTypes]
