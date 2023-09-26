export const ContentFormAction = {
  uusi: 'uusi',
  muokkaus: 'muokkaus'
}
export type ContentFormAction = (typeof ContentFormAction)[keyof typeof ContentFormAction]

export const PublishState = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Archived: 'ARCHIVED'
} as const

export type PublishState = (typeof PublishState)[keyof typeof PublishState]

export const Exam = {
  SUKO: 'SUKO',
  LD: 'LD',
  PUHVI: 'PUHVI'
} as const
export type Exam = (typeof Exam)[keyof typeof Exam]

export type BaseIn = {
  id: number
  publishState: PublishState
  createdAt: string
  updatedAt: string
}

export type BaseAssignmentIn = BaseIn & {
  nameFi: string
  nameSv: string
  contentFi: string[]
  contentSv: string[]
  instructionFi: string
  instructionSv: string
  isFavorite: boolean
}

export type AssignmentIn = BaseAssignmentIn & {
  aiheKoodiArvos: string[]
  assignmentTypeKoodiArvo: string
  laajaalainenOsaaminenKoodiArvos: string[]
  oppimaaraKoodiArvo: string
  tavoitetasoKoodiArvo: string
}

export type SukoAssignmentIn = AssignmentIn & {
  assignmentTypeKoodiArvo: string
}

export type LdAssignmentIn = AssignmentIn & {
  aineKoodiArvo: string
  lukuvuosiKoodiArvos: string[]
}

export type PuhviAssignmentIn = AssignmentIn & {
  assignmentTypeKoodiArvo: string
  lukuvuosiKoodiArvos: string[]
}

export type BaseInstructionIn = BaseIn & {
  nameFi: string
  nameSv: string
  contentFi: string
  contentSv: string
  instructionFi: string
  instructionSv: string
}

export type InstructionIn = BaseInstructionIn & {
  shortDescriptionFi: string
  shortDescriptionSv: string
  attachments: AttachmentIn[]
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
  koetehtavat: 'koetehtavat',
  ohjeet: 'ohjeet',
  todistukset: 'todistukset'
} as const
export type ContentType = (typeof ContentType)[keyof typeof ContentType]
type ContentTypeMapping = {
  [key in keyof typeof ContentType]: string
}

export const ContentTypeSingular: ContentTypeMapping = {
  koetehtavat: 'koetehtava',
  ohjeet: 'ohje',
  todistukset: 'todistus'
}

export const ContentTypeSingularEng: ContentTypeMapping = {
  koetehtavat: 'assignment',
  ohjeet: 'instruction',
  todistukset: 'certificate'
}

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
