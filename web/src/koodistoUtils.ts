import { KoodiDtoIn } from './LudosContext'

export const getSelectedOptions = (selectedKoodisto: string[] | null, koodit?: KoodiDtoIn[]) =>
  koodit?.filter((koodi) => selectedKoodisto?.includes(koodi.koodiArvo)) || []

export const sortKooditAlphabetically = (koodit: KoodiDtoIn[]) => {
  const language = document.documentElement.lang
  const locale = language === 'fi' ? 'fi-FI' : 'sv-SE'

  return koodit.sort((a, b) =>
    a.nimi.localeCompare(b.nimi, locale, {
      sensitivity: 'base'
    })
  )
}

export const sortKooditByArvo = (koodit: KoodiDtoIn[]) => koodit.sort((a, b) => a.koodiArvo.localeCompare(b.koodiArvo))
