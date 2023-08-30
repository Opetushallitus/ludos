export type Page = {
  titleKey: string
  path: string
}

export const EXAM_TYPES = ['suko', 'ld', 'puhvi']

export const PAGE_HEADERS = ['frontpage', ...EXAM_TYPES, 'palautteet'] as const

export type PageHeaders = (typeof PAGE_HEADERS)[number]

export type NavigationPages = Record<PageHeaders, Page>

export type AllPages = NavigationPages & {
  create: Page
}

export const PublishState = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Archived: 'ARCHIVED'
} as const

export type PublishState = (typeof PublishState)[keyof typeof PublishState]

export const Exam = {
  Suko: 'SUKO',
  Ld: 'LD',
  Puhvi: 'PUHVI'
} as const

export type Exam = (typeof Exam)[keyof typeof Exam]

export type BaseIn = {
  id: number
  publishState: PublishState
  createdAt: string
  updatedAt: string
}

export type BaseAssignmentAndInstructionIn = BaseIn & {
  nameFi: string
  nameSv: string
  contentFi: string
  contentSv: string
  instructionFi: string
  instructionSv: string
}

export type InstructionIn = BaseAssignmentAndInstructionIn & {
  shortDescriptionFi: string
  shortDescriptionSv: string
  attachments: AttachmentIn[]
}

export type AssignmentIn = BaseAssignmentAndInstructionIn & {
  isFavorite: boolean
  laajaalainenOsaaminenKoodiArvos: string[]
}

export type SukoAssignmentIn = AssignmentIn & {
  assignmentTypeKoodiArvo: string
  oppimaaraKoodiArvo: string
  tavoitetasoKoodiArvo: string
  aiheKoodiArvos: string[]
}

export type LdAssignmentIn = AssignmentIn & {
  aineKoodiArvo: string
  lukuvuosiKoodiArvos: string[]
}

export type PuhviAssignmentIn = AssignmentIn & {
  assignmentTypeKoodiArvo: string
  lukuvuosiKoodiArvos: string[]
}

export type AttachmentIn = {
  fileName: string
  fileKey: string
  fileUploadDate: string
  name: string
  language: 'FI' | 'SV'
}

export type CertificateIn = BaseIn & {
  name: string
  description: string
  attachment: AttachmentIn
}

export const ContentType = {
  KOETEHTAVAT: 'koetehtavat',
  OHJEET: 'ohjeet',
  TODISTUKSET: 'todistukset'
} as const
export type ContentType = (typeof ContentType)[keyof typeof ContentType]

export const ContentTypeEng = {
  KOETEHTAVAT: 'assignments',
  OHJEET: 'instructions',
  TODISTUKSET: 'certificates'
}
export type ContentTypeEng = (typeof ContentTypeEng)[keyof typeof ContentTypeEng]

export type ContentTypeKeys = keyof typeof ContentType

type SingularOptions = {
  [key in ContentTypeKeys]: string
}

export const ContentTypesSingular: SingularOptions = {
  KOETEHTAVAT: 'koetehtava',
  OHJEET: 'ohje',
  TODISTUKSET: 'todistus'
}

export type ValueOf<T> = T[keyof T]

export const Roles = {
  YLLAPITAJA: 'YLLAPITAJA',
  LAATIJA: 'LAATIJA',
  OPETTAJA: 'OPETTAJA',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const

type RolesType = keyof typeof Roles

export type UserDetails = {
  firstNames: string | null
  lastName: string | null
  role: RolesType | null
}

export const ErrorMessages = {
  REQUIRED: 'required',
  SHORT: 'short',
  NO_FILE: 'no_file',
  ASSIGNMENT_NAME_REQUIRED: 'assignment_name_required'
} as const

export type ErrorMessagesType = (typeof ErrorMessages)[keyof typeof ErrorMessages]

export type FileDetails = Partial<AttachmentIn> & {
  fileName: string
}

type Metadata = {
  name: string
  language: AttachmentLanguage
}

export type MapWithFileKeyAndMetadata = Map<string, Metadata>

export type AttachmentLanguage = 'fi' | 'sv'

export type AttachmentData = {
  attachment?: AttachmentIn
  name: string
  language?: AttachmentLanguage
  file?: File
}
