import { createContext } from 'react'
import { UserDetails } from '../types'
import { KoodiDtoOut, KoodistoName } from '../hooks/useKoodisto'

export type KoodistoMap = Record<KoodistoName, Record<string, KoodiDtoOut>>

interface LudosContextValue {
  koodistos: KoodistoMap
  setKoodistos: (koodistos: KoodistoMap) => void
  userDetails?: UserDetails
  setUserDetails: (userDetails: UserDetails) => void
  userFavoriteAssignmentCount: number
  setUserFavoriteAssignmentCount: (count: number) => void
}

export const defaultEmptyKoodistoMap: KoodistoMap = Object.fromEntries(
  Object.values(KoodistoName).map((name) => [name, {}])
) as unknown as KoodistoMap

export const LudosContext = createContext<LudosContextValue>({
  koodistos: defaultEmptyKoodistoMap,
  setKoodistos: () => {},
  userDetails: undefined,
  setUserDetails: () => {},
  userFavoriteAssignmentCount: -1,
  setUserFavoriteAssignmentCount: () => {}
})
