import { KoodiDtoIn } from './KoodistoContext'

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

export const getSelectedOptions = (selectedKoodisto: string[] | null, koodit?: KoodiDtoIn[]) =>
  koodit?.filter((koodi) => selectedKoodisto?.includes(koodi.koodiArvo)) || []

export const sortKooditAlphabetically = (koodit: KoodiDtoIn[]) => {
  const language = document.documentElement.lang
  const options = { sensitivity: 'base' }
  const locale = language === 'fi' ? 'fi-FI' : 'sv-SE'

  return koodit.sort((a, b) => a.nimi.localeCompare(b.nimi, locale, options))
}

export const sortKooditByArvo = (koodit: KoodiDtoIn[]) => koodit.sort((a, b) => a.koodiArvo.localeCompare(b.koodiArvo))
