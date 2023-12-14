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

export type NonDeletedPublishState = Exclude<PublishState, typeof PublishState.Deleted>

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
  updaterOid: string
  updaterName: string | null
  version: number
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

export type ContentOut<T = BaseOut> = {
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

export type CertificateDtoOut = BaseOut & {
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

export const BusinessLanguage = {
  fi: 'fi',
  sv: 'sv',
  en: 'en'
}

export type BusinessLanguageType = keyof typeof BusinessLanguage

export type UserDetails = {
  firstNames: string | null
  lastName: string | null
  role: RolesType | null
  businessLanguage: BusinessLanguageType | null
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
