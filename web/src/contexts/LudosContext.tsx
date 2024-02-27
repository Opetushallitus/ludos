import { createContext } from 'react'
import { KoodistoName, Language, UserDetails } from '../types'
import { KoodiDtoOut } from '../hooks/useKoodisto'

export const defaultLanguage = Language.FI
export const ludosUILanguageKey = 'ludosUILanguage'
export const ludosTeachingLanguageKey = 'ludosTeachingLanguage'

export type LanguageKoodistoMap = Record<Language, Record<KoodistoName, Record<string, KoodiDtoOut>>>
export type KoodistoMap = Record<KoodistoName, Record<string, KoodiDtoOut>>
interface LudosContextValue {
  koodistos: LanguageKoodistoMap
  setKoodistos: (koodistos: LanguageKoodistoMap) => void
  userDetails?: UserDetails
  setUserDetails: (userDetails: UserDetails) => void
  userFavoriteAssignmentCount: number
  setUserFavoriteAssignmentCount: (count: number) => void
  teachingLanguage: Language
  setTeachingLanguage: (lang: Language) => void
  uiLanguage: Language
  setUiLanguage: (lang: string) => void
}

export const defaultEmptyKoodistoMap: KoodistoMap = Object.fromEntries(
  Object.values(KoodistoName).map((name) => [name, {}])
) as unknown as KoodistoMap

const placeholderValuesNotInUse: LudosContextValue = {
  koodistos: {
    [Language.FI]: defaultEmptyKoodistoMap,
    [Language.SV]: defaultEmptyKoodistoMap
  },
  setKoodistos: () => {},
  userDetails: undefined,
  setUserDetails: () => {},
  userFavoriteAssignmentCount: -1,
  setUserFavoriteAssignmentCount: () => {},
  teachingLanguage: Language.FI,
  setTeachingLanguage: () => {},
  uiLanguage: defaultLanguage,
  setUiLanguage: () => {}
}

export const LudosContext = createContext(placeholderValuesNotInUse)
