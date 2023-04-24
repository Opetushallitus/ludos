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
  name: string
  content: string
  state: AssignmentState
  examType: Exam
  createdAt: string
  updatedAt: string
}

export type SukoAssignmentIn = AssignmentIn & {
  assignmentType: string
}

export const ExamTypes = {
  KOETEHTAVAT: 'koetehtavat',
  OHJEET: 'ohjeet',
  TODISTUKSET: 'todistukset'
} as const

export type ExamsKey = keyof typeof ExamTypes

type SingularOptions = {
  [key in ExamsKey]: string
}

export const ExamsSingular: SingularOptions = {
  KOETEHTAVAT: 'koetehtava',
  OHJEET: 'ohje',
  TODISTUKSET: 'todistus'
}

export type ExamType = (typeof ExamTypes)[keyof typeof ExamTypes]
