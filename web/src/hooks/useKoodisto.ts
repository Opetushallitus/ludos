import { LudosContext } from '../contexts/LudosContext'
import { useContext } from 'react'
import { BusinessLanguage, KoodistoName, Oppimaara } from '../types'
import { preventLineBreaksFromHyphen } from '../utils/formatUtils'

export type KoodiDtoOut = {
  koodiArvo: string
  nimi: string
  tarkenteet?: string[]
}

const defaultLabel = '*'

export function useKoodisto() {
  const { koodistos } = useContext(LudosContext)

  function getKoodiLabel(koodiArvo: string, koodistoName: KoodistoName) {
    return koodi(koodiArvo, koodistos[koodistoName])?.nimi ?? defaultLabel
  }

  function getKoodisLabel(koodiArvo: string[], koodistoName: KoodistoName) {
    return koodiArvo
      .map((koodi) => getKoodiLabel(koodi, koodistoName))
      .sort()
      .join(', ')
  }

  function getOppimaaraLabel(oppimaara: Oppimaara): string {
    return oppimaaraLabel(
      getKoodiLabel(oppimaara.oppimaaraKoodiArvo, 'oppiaineetjaoppimaaratlops2021'),
      oppimaara.kielitarjontaKoodiArvo ? getKoodiLabel(oppimaara.kielitarjontaKoodiArvo, 'lukiokielitarjonta') : null
    )
  }

  return {
    koodistos,
    getKoodiLabel,
    getKoodisLabel,
    getOppimaaraLabel
  }
}

export function oppimaaraLabel(oppimaaraKoodiArvoLabel: string, kielitarjontaKoodiArvoLabel: string | null): string {
  const label = kielitarjontaKoodiArvoLabel
    ? `${oppimaaraKoodiArvoLabel}, ${kielitarjontaKoodiArvoLabel}`
    : oppimaaraKoodiArvoLabel
  return preventLineBreaksFromHyphen(label)
}

export function koodi(koodiArvo: string, koodisto: Record<string, KoodiDtoOut>): KoodiDtoOut | null {
  return koodisto[koodiArvo] || null
}

export function koodiOrDefaultLabel(koodiArvo: string, koodisto: Record<string, KoodiDtoOut>): KoodiDtoOut {
  const koodiOrNull = koodi(koodiArvo, koodisto)
  if (koodiOrNull === null) {
    return { koodiArvo, nimi: defaultLabel }
  } else {
    return koodiOrNull
  }
}

export function koodisOrDefaultLabel(koodiArvos: string[], koodisto: Record<string, KoodiDtoOut>): KoodiDtoOut[] {
  return (koodiArvos || []).map((koodiArvo) => koodiOrDefaultLabel(koodiArvo, koodisto))
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
