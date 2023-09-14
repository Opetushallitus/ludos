import {
  AssignmentIn,
  BaseAssignmentAndInstructionIn,
  BaseIn,
  CertificateIn,
  ContentType,
  Exam,
  InstructionIn,
  LdAssignmentIn,
  PuhviAssignmentIn,
  SukoAssignmentIn
} from '../../../types'

export const ContentTypeTranslationFinnish = {
  assignments: 'koetehtavat',
  instructions: 'ohjeet',
  certificates: 'todistukset'
} as { [key: string]: string }

// exam type checkers
export const assertPuhviOrLdAssignment = (
  assignment: AssignmentIn,
  activeTab: any
): assignment is PuhviAssignmentIn | LdAssignmentIn => {
  return isLdAssignment(assignment, activeTab) || isPuhviAssignment(assignment, activeTab)
}
export const isSukoAssignment = (assignment: AssignmentIn, exam: Exam): assignment is SukoAssignmentIn =>
  exam === Exam.Suko &&
  'aiheKoodiArvos' in assignment &&
  'assignmentTypeKoodiArvo' in assignment &&
  'laajaalainenOsaaminenKoodiArvos' in assignment &&
  'oppimaaraKoodiArvo' in assignment &&
  'tavoitetasoKoodiArvo' in assignment
export const isPuhviAssignment = (assignment: AssignmentIn, exam: Exam): assignment is PuhviAssignmentIn =>
  exam === Exam.Puhvi && 'lukuvuosiKoodiArvos' in assignment

export const isLdAssignment = (assignment: AssignmentIn, exam: Exam): assignment is LdAssignmentIn =>
  exam === Exam.Ld && 'aineKoodiArvo' in assignment && 'lukuvuosiKoodiArvos' in assignment
// content type checkers
export const isAssignment = (data: BaseIn, contentType: ContentType): data is AssignmentIn =>
  contentType === ContentType.koetehtavat
export const isInstruction = (data: BaseIn, contentType: ContentType): data is InstructionIn =>
  contentType === ContentType.ohjeet
export const isCertificate = (data: BaseIn, contentType: ContentType): data is CertificateIn =>
  contentType === ContentType.todistukset

export const isAssignmentsArr = (data: BaseIn[], contentType: ContentType): data is AssignmentIn[] =>
  data.every((item) => isAssignment(item, contentType))

export const isInstructionsArr = (data: BaseIn[], contentType: ContentType): data is InstructionIn[] =>
  data.every((item) => isInstruction(item, contentType))

export const isCertificatesArr = (data: BaseIn[], contentType: ContentType): data is CertificateIn[] =>
  data.every((item) => isCertificate(item, contentType))

export const isAssignmentOrInstruction = (
  data: BaseIn,
  contentType: ContentType
): data is BaseAssignmentAndInstructionIn =>
  contentType === ContentType.koetehtavat || contentType === ContentType.ohjeet

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

export const getContentName = (data: BaseIn, contentType: ContentType, language: string) => {
  if (isCertificate(data, contentType)) {
    return data.name
  } else if (isAssignmentOrInstruction(data, contentType)) {
    return language === 'fi' ? data.nameFi : data.nameSv
  }
}
