export const ContentFormAction = {
  uusi: 'uusi',
  muokkaus: 'muokkaus'
} as const
export type ContentFormAction = (typeof ContentFormAction)[keyof typeof ContentFormAction]

export const TeachingLanguage = {
  FI: 'FI',
  SV: 'SV'
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

export type NonDeletedPublishState = Exclude<PublishState, typeof PublishState.Deleted>

export const Exam = {
  SUKO: 'SUKO',
  LD: 'LD',
  PUHVI: 'PUHVI'
} as const
export type Exam = (typeof Exam)[keyof typeof Exam]

export interface ContentBase {
  nameFi: string
  nameSv: string
  exam: Exam
  contentType: ContentType
  publishState: PublishState
}

export type ContentBaseOut = ContentBase & {
  id: number
  createdAt: string
  updatedAt: string
  authorOid: string
  updaterOid: string
  updaterName: string | null
  version: number
}

export const isAssignment = (data: ContentBaseOut): data is AssignmentOut => data.contentType === ContentType.ASSIGNMENT
export const isSukoAssignment = (assignment: ContentBaseOut): assignment is SukoAssignmentDtoOut =>
  assignment.exam === Exam.SUKO && isAssignment(assignment)
export const isLdAssignment = (data: ContentBaseOut): data is LdAssignmentDtoOut =>
  data.exam === Exam.LD && isAssignment(data)
export const isPuhviAssignment = (data: ContentBaseOut): data is PuhviAssignmentDtoOut =>
  data.exam === Exam.PUHVI && isAssignment(data)

export const isInstruction = (data: ContentBaseOut): data is SukoOrPuhviInstructionDtoOut | LdInstructionDtoOut =>
  data.contentType === ContentType.INSTRUCTION
export const isLdInstruction = (data: ContentBaseOut): data is LdInstructionDtoOut =>
  data.exam === Exam.LD && isInstruction(data)
export const isSukoOrPuhviInstruction = (data: ContentBaseOut): data is SukoOrPuhviInstructionDtoOut =>
  (data.exam === Exam.SUKO || data.exam === Exam.PUHVI) && isInstruction(data)

export const isCertificate = (
  data: ContentBaseOut
): data is LdCertificateDtoOut | PuhviCertificateDtoOut | SukoCertificateDtoOut =>
  data.contentType === ContentType.CERTIFICATE
export const isSukoCertificate = (data: ContentBaseOut): data is SukoCertificateDtoOut =>
  data.exam === Exam.SUKO && isCertificate(data)
export const isLdCertificate = (data: ContentBaseOut): data is LdCertificateDtoOut =>
  data.exam === Exam.LD && isCertificate(data)
export const isPuhviCertificate = (data: ContentBaseOut): data is PuhviCertificateDtoOut =>
  data.exam === Exam.PUHVI && isCertificate(data)

export type AssignmentOut = ContentBaseOut & {
  nameFi: string
  nameSv: string
  contentFi: string[]
  contentSv: string[]
  instructionFi: string
  instructionSv: string
  laajaalainenOsaaminenKoodiArvos: string[]
}

export type AssignmentCardOut = ContentBaseOut & {
  id: number
  exam: Exam
  publishState: PublishState
  createdAt: string
  nameFi: string
  nameSv: string
}

export type Oppimaara = {
  oppimaaraKoodiArvo: string
  kielitarjontaKoodiArvo: string | null
}
export type AssignmentFilterOptions = {
  oppimaara: Oppimaara[] | null
  tehtavatyyppi: string[] | null
  aihe: string[] | null
  tavoitetaitotaso: string[] | null
  lukuvuosi: string[] | null
  aine: string[] | null
}
export const emptyAssignmentFilterOptions: AssignmentFilterOptions = {
  oppimaara: null,
  tehtavatyyppi: null,
  aihe: null,
  tavoitetaitotaso: null,
  lukuvuosi: null,
  aine: null
}

export type ContentOut<T = ContentBaseOut> = {
  content: T[]
}

export type InstructionsOut = {
  content: InstructionDtoOut[]
  totalPages: number
  currentPage: number
  instructionFilterOptions: {
    aine: AssignmentFilterOptions['aine']
  }
}

export type AssignmentsOut = {
  content: AssignmentCardOut[]
  totalPages: number
  currentPage: number
  assignmentFilterOptions: AssignmentFilterOptions
}

export type SukoAssignmentDtoOut = AssignmentCardOut & {
  assignmentTypeKoodiArvo: string
  oppimaara: Oppimaara
  tavoitetasoKoodiArvo: string
  aiheKoodiArvos: string[]
}

export type LdAssignmentDtoOut = AssignmentCardOut & {
  aineKoodiArvo: string
  lukuvuosiKoodiArvos: string[]
}

export type PuhviAssignmentDtoOut = AssignmentCardOut & {
  assignmentTypeKoodiArvo: string
  lukuvuosiKoodiArvos: string[]
}

export type InstructionDtoOut = ContentBaseOut & {
  nameFi: string
  nameSv: string
  contentFi: string
  contentSv: string
  attachments: AttachmentDtoOut[]
}

export type SukoOrPuhviInstructionDtoOut = InstructionDtoOut & {
  shortDescriptionFi: string
  shortDescriptionSv: string
}

export type LdInstructionDtoOut = InstructionDtoOut & {
  aineKoodiArvo: string
}

export type AttachmentDtoOut = {
  fileName: string
  fileKey: string
  fileUploadDate?: string
  name: string
  language: 'FI' | 'SV'
}

export type ImageDtoOut = {
  url: string
  fileName: string
}

export type CertificateDtoOut = ContentBaseOut & {
  nameFi: string
  nameSv: string
}

export type SukoCertificateDtoOut = CertificateDtoOut & {
  descriptionFi: string
  attachmentFi: AttachmentDtoOut
}

export type LdCertificateDtoOut = CertificateDtoOut & {
  aineKoodiArvo: string
  attachmentFi: AttachmentDtoOut
  attachmentSv?: AttachmentDtoOut
}

export type PuhviCertificateDtoOut = CertificateDtoOut & {
  descriptionFi: string
  descriptionSv: string
  attachmentFi: AttachmentDtoOut
  attachmentSv?: AttachmentDtoOut
}

export const ContentType = {
  ASSIGNMENT: 'ASSIGNMENT',
  INSTRUCTION: 'INSTRUCTION',
  CERTIFICATE: 'CERTIFICATE'
} as const
export type ContentType = (typeof ContentType)[keyof typeof ContentType]

type ContentTypeMapping = {
  readonly [key in keyof typeof ContentType]: string
}

export const ContentTypePluralFi: {
  readonly [key in keyof typeof ContentType]: 'koetehtavat' | 'ohjeet' | 'todistukset'
} = {
  ASSIGNMENT: 'koetehtavat',
  INSTRUCTION: 'ohjeet',
  CERTIFICATE: 'todistukset'
} as const
export type ContentTypePluralFi = (typeof ContentTypePluralFi)[keyof typeof ContentTypePluralFi]

export const ContentTypeByContentTypePluralFi = {
  [ContentTypePluralFi.ASSIGNMENT]: ContentType.ASSIGNMENT,
  [ContentTypePluralFi.INSTRUCTION]: ContentType.INSTRUCTION,
  [ContentTypePluralFi.CERTIFICATE]: ContentType.CERTIFICATE
} as const

export const ContentTypeSingularFi: ContentTypeMapping = {
  ASSIGNMENT: 'koetehtava',
  INSTRUCTION: 'ohje',
  CERTIFICATE: 'todistus'
} as const

export const ContentTypeSingularEn: ContentTypeMapping = {
  ASSIGNMENT: 'assignment',
  INSTRUCTION: 'instruction',
  CERTIFICATE: 'certificate'
} as const

export const Roles = {
  YLLAPITAJA: 'YLLAPITAJA',
  LAATIJA: 'LAATIJA',
  OPETTAJA: 'OPETTAJA',
  UNAUTHORIZED: 'UNAUTHORIZED'
} as const

type RolesType = keyof typeof Roles

export const BusinessLanguage = {
  fi: 'fi',
  sv: 'sv',
  en: 'en'
} as const

export type BusinessLanguage = keyof typeof BusinessLanguage

export type UserDetails = {
  firstNames: string | null
  lastName: string | null
  role: RolesType | null
  businessLanguage: BusinessLanguage | null
}

export const ErrorMessages = {
  REQUIRED: 'required',
  REQUIRED_IMG_ALT: 'required_img_alt',
  SHORT: 'short',
  NO_FILE: 'no_file',
  ASSIGNMENT_NAME_REQUIRED: 'assignment_name_required'
} as const

export type ErrorMessagesType = (typeof ErrorMessages)[keyof typeof ErrorMessages]

export type FileDetails = Partial<AttachmentDtoOut> & {
  fileName: string
}

export type AttachmentLanguage = TeachingLanguage

export type AttachmentData = {
  attachment?: AttachmentDtoOut
  name: string
  language?: AttachmentLanguage
  file?: File
}
export const oppimaaraId: (oppimaara: Oppimaara) => string = (oppimaara: Oppimaara) =>
  oppimaara.kielitarjontaKoodiArvo
    ? `${oppimaara.oppimaaraKoodiArvo}.${oppimaara.kielitarjontaKoodiArvo}`
    : oppimaara.oppimaaraKoodiArvo
export const oppimaaraFromId: (oppimaaraId: string) => Oppimaara = (oppimaaraId: string) => {
  if (!/^([A-Z0-9]+(\.[A-Z0-9]+)?)$/.test(oppimaaraId)) {
    throw new Error(`Invalid oppimaaraId: ${oppimaaraId}}`)
  }
  const oppimaaraParts = oppimaaraId.split('.')
  return {
    oppimaaraKoodiArvo: oppimaaraParts[0],
    kielitarjontaKoodiArvo: oppimaaraParts.length === 2 ? oppimaaraParts[1] : null
  }
}
export const KoodistoName = {
  OPPIAINEET_JA_OPPIMAARAT_LOPS2021: 'oppiaineetjaoppimaaratlops2021',
  KIELITARJONTA: 'lukiokielitarjonta',
  LAAJA_ALAINEN_OSAAMINEN_LOPS2021: 'laajaalainenosaaminenlops2021',
  TEHTAVATYYPPI_SUKO: 'tehtavatyyppisuko',
  TAITOTASO: 'taitotaso',
  LUDOS_LUKUVUOSI: 'ludoslukuvuosi',
  LUDOS_LUKIODIPLOMI_AINE: 'ludoslukiodiplomiaine',
  TEHTAVATYYPPI_PUHVI: 'tehtavatyyppipuhvi',
  AIHE_SUKO: 'aihesuko'
} as const
export type KoodistoName = (typeof KoodistoName)[keyof typeof KoodistoName]
export const ImageSizeOption = {
  original: 'original',
  small: 'small',
  large: 'large'
} as const
export type ImageSizeOption = (typeof ImageSizeOption)[keyof typeof ImageSizeOption]
export const ImageAlignOption = {
  left: 'left',
  center: 'center'
} as const
export type ImageAlignOption = (typeof ImageAlignOption)[keyof typeof ImageAlignOption]

export const AddToFavoriteOptions = {
  FAVORITES: 'FAVORITES',
  FOLDER: 'FOLDER',
  NEW_FOLDER: 'NEW_FOLDER'
} as const

export type AddToFavoriteOptions = (typeof AddToFavoriteOptions)[keyof typeof AddToFavoriteOptions]

export interface FavoriteFolder {
  id: number
  name: string
  subfolders: FavoriteFolder[]
}

export interface FavoriteFolderDtoOut extends FavoriteFolder {
  subfolders: FavoriteFolderDtoOut[]
}

export interface FavoriteCardFolderDtoOut extends FavoriteFolder {
  assignmentCards: AssignmentCardOut[]
  subfolders: FavoriteCardFolderDtoOut[]
}

export interface FavoriteIdsDtoOut {
  rootFolder: FavoriteFolderDtoOut
  folderIdsByAssignmentId: { [key: number]: number[] }
}
