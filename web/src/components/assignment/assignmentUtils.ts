import { ExamsSingular, ExamsKey, ExamType, ExamTypes } from '../../types'

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
