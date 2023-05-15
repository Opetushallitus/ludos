import { AssignmentIn, SukoAssignmentIn } from './types'
import { KoodiDtoIn, Koodisto } from './KoodistoContext'

// todo: this is not localized
export const SUKO_ASSIGNMENT_ORDER_OPTIONS: KoodiDtoIn[] = [
  {
    koodiArvo: 'asc',
    nimi: 'Vanhin ensin'
  },
  {
    koodiArvo: 'desc',
    nimi: 'Uusin ensin'
  }
]

export const LANGUAGE_OPTIONS: KoodiDtoIn[] = [
  { nimi: 'Suomeksi', koodiArvo: 'fi' },
  { nimi: 'Ruotsiksi', koodiArvo: 'sv' }
]

export function getKoodiLabel(koodiArvo: string, koodit: KoodiDtoIn[] | undefined) {
  const koodi = koodit?.find((type) => type.koodiArvo === koodiArvo)

  return koodi?.nimi || ''
}

export function getKoodisLabel(koodiArvo: string[], koodit: KoodiDtoIn[] | undefined) {
  return koodiArvo.map((koodi) => getKoodiLabel(koodi, koodit)).join(', ')
}

export const AIHE_KOODISTO: Koodisto = [
  {
    koodiArvo: '1',
    nimi: 'Ihmisoikeudet'
  },
  {
    koodiArvo: '2',
    nimi: 'Media'
  },
  {
    koodiArvo: '3',
    nimi: 'Ympäristö'
  }
]

export const getSelectedOptions = (selectedKoodisto: string[] | null, koodit?: KoodiDtoIn[]) =>
  koodit?.filter((koodi) => selectedKoodisto?.includes(koodi.koodiArvo)) || []

export const sortKoodit = (koodit: KoodiDtoIn[]) => {
  const language = document.documentElement.lang
  const options = { sensitivity: 'base' }
  const locale = language === 'fi' ? 'fi-FI' : 'sv-SE'

  return koodit.sort((a, b) => a.nimi.localeCompare(b.nimi, locale, options))
}
