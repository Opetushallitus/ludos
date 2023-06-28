import {
  ContentTypesSingular,
  ContentTypeKeys,
  ContentType,
  AssignmentIn,
  SukoAssignmentIn,
  Exam,
  PuhviAssignmentIn,
  LdAssignmentIn,
  ContentTypeEng,
  CertificateIn,
  BaseIn,
  BaseAssignmentAndInstructionIn
} from '../../../types'

export function getSingularContentTypeFinnish(s: ContentType) {
  const key = Object.keys(ContentType).find((k) => ContentType[k as ContentTypeKeys] === s) as ContentTypeKeys
  return ContentTypesSingular[key]
}

export const ContentTypeTranslationEnglish = {
  koetehtavat: 'assignments',
  ohjeet: 'instructions',
  todistukset: 'certificates'
} as { [key: string]: string }

export const ContentTypeTranslationFinnish = {
  assignments: 'koetehtavat',
  instructions: 'ohjeet',
  certificates: 'todistukset'
} as { [key: string]: string }

// exam type checkers
export const isSukoAssignment = (assignment: AssignmentIn, exam: Exam): assignment is SukoAssignmentIn =>
  exam === Exam.Suko
export const isPuhviAssignment = (assignment: AssignmentIn, exam: Exam): assignment is PuhviAssignmentIn =>
  exam === Exam.Puhvi
export const isLdAssignment = (assignment: AssignmentIn, exam: Exam): assignment is LdAssignmentIn => exam === Exam.Ld
// content type checkers
export const isAssignment = (data: BaseIn, contentType: string): data is AssignmentIn =>
  contentType === ContentTypeEng.KOETEHTAVAT
export const isInstruction = (data: BaseIn, contentType: string): data is AssignmentIn =>
  contentType === ContentTypeEng.OHJEET
export const isCertificate = (data: BaseIn, contentType: string): data is CertificateIn =>
  contentType === ContentTypeEng.TODISTUKSET

export const isAssignmentsArr = (data: BaseIn[], contentType: string): data is AssignmentIn[] =>
  data.every((item) => isAssignment(item, contentType))

export const isInstructionsArr = (data: BaseIn[], contentType: string): data is AssignmentIn[] =>
  data.every((item) => isInstruction(item, contentType))

export const isCertificatesArr = (data: BaseIn[], contentType: string): data is CertificateIn[] =>
  data.every((item) => isCertificate(item, contentType))

export const isAssignmentOrInstruction = (data: BaseIn, contentType: string): data is BaseAssignmentAndInstructionIn =>
  contentType === ContentTypeEng.KOETEHTAVAT || contentType === ContentTypeEng.OHJEET

// Removes key-value pairs with null or undefined values from an object
// src https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript
export function removeEmpty<T extends Record<string, unknown>>(obj: T): any {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => {
      if (Array.isArray(v)) {
        // remove empty arrays
        return v.length > 0
      }
      // remove null and undefined
      return v !== null && v !== undefined
    })
  )
}

export const getContentName = (data: BaseIn, contentType: string, language: string) => {
  if (isCertificate(data, contentType)) {
    return data.name
  } else if (isAssignmentOrInstruction(data, contentType)) {
    return language === 'fi' ? data.nameFi : data.nameSv
  }
}
