import { createContext } from 'react'
import { UserDetails } from './types'

const KoodistoName = {
  OPPIAINEET_JA_OPPIMAARAT_LOPS2021: 'oppiaineetjaoppimaaratlops2021',
  LAAJA_ALAINEN_OSAAMINEN_LOPS2021: 'laajaalainenosaaminenlops2021',
  TEHTAVATYYPPI_SUKO: 'tehtavatyyppisuko',
  TAITOTASO: 'taitotaso',
  LUDOS_LUKUVUOSI: 'ludoslukuvuosi',
  LUDOS_LUKIODIPLOMI_AINE: 'ludoslukiodiplomiaine',
  TEHTAVATYYPPI_PUHVI: 'tehtavatyyppipuhvi',
  AIHE_SUKO: 'aihesuko'
} as const
export type KoodistoName = (typeof KoodistoName)[keyof typeof KoodistoName]

export type KoodiDtoIn = {
  koodiArvo: string
  nimi: string
  kieli?: string
}

export type Koodisto = KoodiDtoIn[]

export type KoodistoMap = {
  [key in KoodistoName]: Koodisto
}

interface LudosContextValue {
  koodistos: KoodistoMap
  setKoodistos: (koodistos: KoodistoMap) => void
  userDetails?: UserDetails
  setUserDetails: (userDetails: UserDetails) => void
  userFavoriteAssignmentCount: number
  setUserFavoriteAssignmentCount: (count: number) => void
}

export const defaultEmptyKoodistoMap: KoodistoMap = Object.fromEntries(
  Object.values(KoodistoName).map((name) => [name, []])
) as unknown as KoodistoMap

export const LudosContext = createContext<LudosContextValue>({
  koodistos: defaultEmptyKoodistoMap,
  setKoodistos: () => {},
  userDetails: undefined,
  setUserDetails: () => {},
  userFavoriteAssignmentCount: 0,
  setUserFavoriteAssignmentCount: () => {}
})
