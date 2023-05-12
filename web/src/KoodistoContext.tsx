import { createContext } from 'react'

const KoodistoName = {
  OPPIAINEET_JA_OPPIMAARAT_LOPS2021: 'oppiaineetjaoppimaaratlops2021',
  LAAJA_ALAINEN_OSAAMINEN_LOPS2021: 'laajaalainenosaaminenlops2021',
  TEHTAVATYYPPI_SUKO: 'tehtavatyyppisuko',
  TAITOTASO: 'taitotaso',
  LUDOS_LUKUVUOSI: 'ludoslukuvuosi',
  LUDOS_LUKIODIPLOMI_AINE: 'ludoslukiodiplomiaine'
} as const
type KoodistoName = (typeof KoodistoName)[keyof typeof KoodistoName]

export type KoodiDtoIn = {
  koodiArvo: string
  nimi: string
  kieli: string
}

export type Koodisto = KoodiDtoIn[]

export type KoodistoMap = {
  [key in KoodistoName]: Koodisto
}

interface KoodistoContextValue {
  koodistos: KoodistoMap
  setKoodistos: (koodistos: KoodistoMap) => void
}

export const defaultEmptyKoodistoMap: KoodistoMap = Object.fromEntries(
  Object.values(KoodistoName).map((name) => [name, []])
) as unknown as KoodistoMap

export const KoodistoContext = createContext<KoodistoContextValue>({
  koodistos: defaultEmptyKoodistoMap,
  setKoodistos: () => {}
})
