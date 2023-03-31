export type Page = {
  title: string
  path: string
}

export const PAGE_HEADERS = ['frontpage', 'assignments', 'instructions', 'certificates', 'feedback'] as const

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
