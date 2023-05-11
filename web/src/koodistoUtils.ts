import { SukoAssignmentIn } from './types'
import { KoodiDtoIn } from './KoodistoContext'

export const SUKO_ASSIGNMENT_ORDER_OPTIONS = [
  {
    key: 'asc',
    value: 'Vanhin ensin'
  },
  {
    key: 'desc',
    value: 'Uusin ensin'
  }
]

export const LANGUAGE_OPTIONS = [
  { value: 'Suomeksi', key: 'fi' },
  { value: 'Ruotsiksi', key: 'sv' }
]

export function getAssignmentTypeName(assignment: SukoAssignmentIn, koodit: KoodiDtoIn[] | undefined) {
  const koodi = koodit?.find((type) => type.koodiArvo === assignment.assignmentTypeKoodiArvo)

  return koodi?.nimi || ''
}
