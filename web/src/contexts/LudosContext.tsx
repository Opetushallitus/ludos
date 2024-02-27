import { createContext } from 'react'
import { KoodistoName, TeachingLanguage, UserDetails } from '../types'
import { KoodiDtoOut } from '../hooks/useKoodisto'

export const defaultLanguage = 'fi'
export const ludosUILanguageKey = 'ludosUILanguage'
export const ludosTeachingLanguageKey = 'ludosTeachingLanguage'

export type LanguageKoodistoMap = Record<TeachingLanguage, Record<KoodistoName, Record<string, KoodiDtoOut>>>
export type KoodistoMap = Record<KoodistoName, Record<string, KoodiDtoOut>>
interface LudosContextValue {
  koodistos: LanguageKoodistoMap
  setKoodistos: (koodistos: LanguageKoodistoMap) => void
  userDetails?: UserDetails
  setUserDetails: (userDetails: UserDetails) => void
  userFavoriteAssignmentCount: number
  setUserFavoriteAssignmentCount: (count: number) => void
  teachingLanguage: TeachingLanguage
  setTeachingLanguage: (lang: TeachingLanguage) => void
  uiLanguage: string
  setUiLanguage: (lang: string) => void
}

export const defaultEmptyKoodistoMap: KoodistoMap = Object.fromEntries(
  Object.values(KoodistoName).map((name) => [name, {}])
) as unknown as KoodistoMap

const placeholderValuesNotInUse: LudosContextValue = {
  koodistos: {
    [TeachingLanguage.FI]: defaultEmptyKoodistoMap,
    [TeachingLanguage.SV]: defaultEmptyKoodistoMap
  },
  setKoodistos: () => {},
  userDetails: undefined,
  setUserDetails: () => {},
  userFavoriteAssignmentCount: -1,
  setUserFavoriteAssignmentCount: () => {},
  teachingLanguage: TeachingLanguage.FI,
  setTeachingLanguage: () => {},
  uiLanguage: defaultLanguage,
  setUiLanguage: () => {}
}

export const LudosContext = createContext(placeholderValuesNotInUse)
