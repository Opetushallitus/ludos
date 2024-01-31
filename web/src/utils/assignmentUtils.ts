import {
  AssignmentOut,
  BaseOut,
  Exam,
  LdAssignmentDtoOut,
  PuhviAssignmentDtoOut,
  SukoAssignmentDtoOut,
  TeachingLanguage
} from '../types'
import { isInstruction } from './instructionUtils'
import { isCertificate, isSukoCertificate } from './certificateUtils'

export const isSukoAssignment = (assignment: BaseOut): assignment is SukoAssignmentDtoOut =>
  assignment.exam === Exam.SUKO &&
  'aiheKoodiArvos' in assignment &&
  'assignmentTypeKoodiArvo' in assignment &&
  'oppimaara' in assignment

export const isLdAssignment = (assignment: BaseOut): assignment is LdAssignmentDtoOut =>
  assignment.exam === Exam.LD && 'aineKoodiArvo' in assignment && 'lukuvuosiKoodiArvos' in assignment
export const isPuhviAssignment = (assignment: BaseOut): assignment is PuhviAssignmentDtoOut =>
  assignment.exam === Exam.PUHVI && 'lukuvuosiKoodiArvos' in assignment

export const isAssignment = (data: BaseOut): data is AssignmentOut =>
  isSukoAssignment(data) || isLdAssignment(data) || isPuhviAssignment(data)

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

export const getContentName = (data: BaseOut, teachingLanguage: TeachingLanguage) => {
  if (isSukoAssignment(data) || isSukoCertificate(data)) {
    return data.nameFi
  } else if (isAssignment(data) || isInstruction(data) || isCertificate(data)) {
    return teachingLanguage === 'fi' ? data.nameFi : data.nameSv
  } else {
    throw Error(`Data has unknown type: ${typeof data}`)
  }
}
