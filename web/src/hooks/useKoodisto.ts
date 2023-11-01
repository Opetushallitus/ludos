import { LudosContext } from '../contexts/LudosContext'
import { useContext } from 'react'
import { BusinessLanguage, KoodistoName, Oppimaara } from '../types'

export type KoodiDtoOut = {
  koodiArvo: string
  nimi: string
  tarkenteet?: string[]
}

export function useKoodisto() {
  const { koodistos } = useContext(LudosContext)

  function getKoodiLabel(koodiArvo: string, koodistoName: KoodistoName) {
    return getKoodi(koodiArvo, koodistos[koodistoName])?.nimi || '*'
  }

  function getKoodisLabel(koodiArvo: string[], koodistoName: KoodistoName) {
    return koodiArvo
      .map((koodi) => getKoodiLabel(koodi, koodistoName))
      .sort()
      .join(', ')
  }

  function getOppimaaraLabel(oppimaara: Oppimaara): string {
    return `${getKoodiLabel(oppimaara.oppimaaraKoodiArvo, 'oppiaineetjaoppimaaratlops2021')}${
      oppimaara.kielitarjontaKoodiArvo
        ? `, ${getKoodiLabel(oppimaara.kielitarjontaKoodiArvo, 'lukiokielitarjonta')}`
        : ''
    }`
  }

  return {
    koodistos,
    getKoodiLabel,
    getKoodisLabel,
    getOppimaaraLabel
  }
}

export function getKoodi(koodiArvo: string, koodisto: Record<string, KoodiDtoOut>): KoodiDtoOut | null {
  return koodisto[koodiArvo] || null
}

export const sortKooditAlphabetically = (koodit: KoodiDtoOut[]) => {
  const language = document.documentElement.lang
  const locale = language === BusinessLanguage.fi ? 'fi-FI' : 'sv-SE'

  return koodit.sort((a, b) =>
    a.nimi.localeCompare(b.nimi, locale, {
      sensitivity: 'base'
    })
  )
}
export const sortKooditByArvo = (koodit: Record<string, KoodiDtoOut>) =>
  Object.values(koodit).sort((a, b) => a.koodiArvo.localeCompare(b.koodiArvo))
