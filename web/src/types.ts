import { Oppimaara } from './hooks/useKoodisto'

export const ContentFormAction = {
  uusi: 'uusi',
  muokkaus: 'muokkaus'
} as const
export type ContentFormAction = (typeof ContentFormAction)[keyof typeof ContentFormAction]

export const TeachingLanguage = {
  fi: 'fi',
  sv: 'sv'
} as const
export type TeachingLanguage = (typeof TeachingLanguage)[keyof typeof TeachingLanguage]

export const ContentOrder = {
  asc: 'asc',
  desc: 'desc'
} as const
export type ContentOrder = (typeof ContentOrder)[keyof typeof ContentOrder]

export const PublishState = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Deleted: 'DELETED'
} as const
export type PublishState = (typeof PublishState)[keyof typeof PublishState]

export const Exam = {
  SUKO: 'SUKO',
  LD: 'LD',
  PUHVI: 'PUHVI'
} as const
export type Exam = (typeof Exam)[keyof typeof Exam]

export type BaseOut = {
  id: number
  exam: Exam
  publishState: PublishState
  createdAt: string
  updatedAt: string
}

export type AssignmentOut = BaseOut & {
  nameFi: string
  nameSv: string
  contentFi: string[]
  contentSv: string[]
  instructionFi: string
  instructionSv: string
  isFavorite: boolean
  laajaalainenOsaaminenKoodiArvos: string[]
}

export type AssignmentFilterOptions = {
  oppimaara: Oppimaara[]
  tehtavatyyppi: string[]
  aihe: string[]
  tavoitetaitotaso: string[]
  lukuvuosi: string[]
  aine: string[]
}

export type ContentOut<T = BaseOut> = {
  content: T[]
}

export type AssignmentsOut = {
  content: AssignmentOut[]
  totalPages: number
  currentPage: number
  assignmentFilterOptions: AssignmentFilterOptions
}

export type SukoAssignmentDtoOut = AssignmentOut & {
  assignmentTypeKoodiArvo: string
  oppimaara: Oppimaara
  tavoitetasoKoodiArvo: string
  aiheKoodiArvos: string[]
}

export type LdAssignmentDtoOut = AssignmentOut & {
  aineKoodiArvo: string
  lukuvuosiKoodiArvos: string[]
}

export type PuhviAssignmentDtoOut = AssignmentOut & {
  assignmentTypeKoodiArvo: string
  lukuvuosiKoodiArvos: string[]
}

export type InstructionDtoOut = BaseOut & {
  nameFi: string
  nameSv: string
  contentFi: string
  contentSv: string
  instructionFi: string
  instructionSv: string
  shortDescriptionFi: string
  shortDescriptionSv: string
  attachments: AttachmentDtoOut[]
}

export type AttachmentDtoOut = {
  fileName: string
  fileKey: string
  fileUploadDate?: string
  name: string
  language: 'FI' | 'SV'
}

export type CertificateDtoOut = BaseOut & {
  name: string
  description: string
  attachment: AttachmentDtoOut
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

export type FileDetails = Partial<AttachmentDtoOut> & {
  fileName: string
}

type Metadata = {
  name: string
  language: AttachmentLanguage
}

export type MapWithFileKeyAndMetadata = Map<string, Metadata>

export type AttachmentLanguage = 'fi' | 'sv'

export type AttachmentData = {
  attachment?: AttachmentDtoOut
  name: string
  language?: AttachmentLanguage
  file?: File
}
