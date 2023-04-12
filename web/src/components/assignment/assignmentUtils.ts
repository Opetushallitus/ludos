import { AssignmentsKey, AssignmentsSingular, AssignmentType, AssignmentTypes } from '../../types'

export function getSingularAssignmentFinnish(s: AssignmentType) {
  const key = Object.keys(AssignmentTypes).find((k) => AssignmentTypes[k as AssignmentsKey] === s) as AssignmentsKey
  return AssignmentsSingular[key]
}

export const AssignmentKeyTranslationEnglish = {
  koetehtavat: 'assignments',
  ohjeet: 'instructions',
  todistukset: 'certificates'
} as { [key: string]: string }

export const AssignmentKeyTranslationFinnish = {
  assignments: 'koetehtävät',
  instructions: 'ohjeet',
  certificates: 'todistukset'
} as { [key: string]: string }
