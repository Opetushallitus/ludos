import { ExamsSingular, ExamsKey, ExamType, ExamTypes, AssignmentIn, SukoAssignmentIn } from '../../../types'

export function getSingularExamTypeFinnish(s: ExamType) {
  const key = Object.keys(ExamTypes).find((k) => ExamTypes[k as ExamsKey] === s) as ExamsKey
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

export const isSukoAssignment = (assignment: AssignmentIn, exam: string): assignment is SukoAssignmentIn =>
  exam === 'suko'
export const isPuhviAssignment = (assignment: AssignmentIn, exam: string): assignment is AssignmentIn =>
  exam === 'puhvi'
export const isLdAssignment = (assignment: AssignmentIn, exam: string): assignment is AssignmentIn => exam === 'ld'
