import {
  AssignmentOut,
  BaseOut,
  CertificateDtoOut,
  ContentType,
  Exam,
  InstructionDtoOut,
  LdAssignmentDtoOut,
  PuhviAssignmentDtoOut,
  SukoAssignmentDtoOut
} from '../../../types'

// exam type checkers
export const assertPuhviOrLdAssignment = (
  assignment: AssignmentOut,
  activeTab: any
): assignment is PuhviAssignmentDtoOut | LdAssignmentDtoOut => {
  return isLdAssignment(assignment, activeTab) || isPuhviAssignment(assignment, activeTab)
}
export const isSukoAssignment = (assignment: AssignmentOut, exam: Exam): assignment is SukoAssignmentDtoOut =>
  exam === Exam.SUKO &&
  'aiheKoodiArvos' in assignment &&
  'assignmentTypeKoodiArvo' in assignment &&
  'laajaalainenOsaaminenKoodiArvos' in assignment &&
  'oppimaara' in assignment &&
  'tavoitetasoKoodiArvo' in assignment
export const isPuhviAssignment = (assignment: AssignmentOut, exam: Exam): assignment is PuhviAssignmentDtoOut =>
  exam === Exam.PUHVI && 'lukuvuosiKoodiArvos' in assignment

export const isLdAssignment = (assignment: AssignmentOut, exam: Exam): assignment is LdAssignmentDtoOut =>
  exam === Exam.LD && 'aineKoodiArvo' in assignment && 'lukuvuosiKoodiArvos' in assignment
// content type checkers
export const isAssignment = (data: BaseOut, contentType: ContentType): data is AssignmentOut =>
  contentType === ContentType.koetehtavat
export const isInstruction = (data: BaseOut, contentType: ContentType): data is InstructionDtoOut =>
  contentType === ContentType.ohjeet
export const isCertificate = (data: BaseOut, contentType: ContentType): data is CertificateDtoOut =>
  contentType === ContentType.todistukset

export const isAssignmentsArr = (data: BaseOut[], contentType: ContentType): data is AssignmentOut[] =>
  data.every((item) => isAssignment(item, contentType))

export const isInstructionsArr = (data: BaseOut[], contentType: ContentType): data is InstructionDtoOut[] =>
  data.every((item) => isInstruction(item, contentType))

export const isCertificatesArr = (data: BaseOut[], contentType: ContentType): data is CertificateDtoOut[] =>
  data.every((item) => isCertificate(item, contentType))

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

export const getContentName = (data: BaseOut, contentType: ContentType, language: string) => {
  if (isAssignment(data, contentType) || isInstruction(data, contentType)) {
    return language === 'fi' ? data.nameFi : data.nameSv
  } else if (isCertificate(data, contentType)) {
    return data.name
  }
}
