import { LudosContext, KoodistoName } from '../LudosContext'
import { useContext } from 'react'

export function useKoodisto() {
  const { koodistos } = useContext(LudosContext)

  function getKoodiLabel(koodiArvo: string, koodistoName: KoodistoName) {
    const koodi = koodistos[koodistoName]?.find((type) => type.koodiArvo === koodiArvo)

    return koodi?.nimi || '*'
  }

  function getKoodisLabel(koodiArvo: string[], koodistoName: KoodistoName) {
    return koodiArvo.map((koodi) => getKoodiLabel(koodi, koodistoName)).join(', ')
  }

  function getSelectedOptions(filter: string[] | null, koodistoName: KoodistoName) {
    return koodistos[koodistoName].filter((koodi) => filter?.includes(koodi.koodiArvo)) || []
  }

  return {
    koodistos,
    getKoodiLabel,
    getKoodisLabel,
    getSelectedOptions
  }
}
