import {
  ExamsSingular,
  ContentTypeKeys,
  ContentType,
  ContentTypes,
  AssignmentIn,
  SukoAssignmentIn,
  Exam
} from '../../../types'

export function getSingularContentTypeFinnish(s: ContentType) {
  const key = Object.keys(ContentTypes).find((k) => ContentTypes[k as ContentTypeKeys] === s) as ContentTypeKeys
  return ExamsSingular[key]
}

export const AssignmentKeyTranslationEnglish = {
  koetehtavat: 'assignments',
  ohjeet: 'instructions',
  todistukset: 'certificates'
} as { [key: string]: string }

export const AssignmentKeyTranslationFinnish = {
  assignments: 'koetehtavat',
  instructions: 'ohjeet',
  certificates: 'todistukset'
} as { [key: string]: string }

export const isSukoAssignment = (assignment: AssignmentIn, exam: Exam): assignment is SukoAssignmentIn =>
  exam === Exam.Suko
export const isPuhviAssignment = (assignment: AssignmentIn, exam: Exam): assignment is AssignmentIn =>
  exam === Exam.Puhvi
export const isLdAssignment = (assignment: AssignmentIn, exam: Exam): assignment is AssignmentIn => exam === Exam.Ld

// Removes key-value pairs with null or undefined values from an object
// src https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript
export function removeEmpty<T extends Record<string, unknown>>(obj: T): any {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== null))
}
