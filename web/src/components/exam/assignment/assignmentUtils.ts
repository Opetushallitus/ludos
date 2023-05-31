import {
  ContentTypesSingular,
  ContentTypeKeys,
  ContentType,
  AssignmentIn,
  SukoAssignmentIn,
  Exam,
  PuhviAssignmentIn,
  LdAssignmentIn
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

export const isSukoAssignment = (assignment: AssignmentIn, exam: Exam): assignment is SukoAssignmentIn =>
  exam === Exam.Suko
export const isPuhviAssignment = (assignment: AssignmentIn, exam: Exam): assignment is PuhviAssignmentIn =>
  exam === Exam.Puhvi
export const isLdAssignment = (assignment: AssignmentIn, exam: Exam): assignment is LdAssignmentIn => exam === Exam.Ld

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
