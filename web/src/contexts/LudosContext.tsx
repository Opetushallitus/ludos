import { createContext } from 'react'
import { Features, KoodistoName, Language, UserDetails } from '../types'
import { KoodiDtoOut } from '../hooks/useKoodisto'

export const defaultLanguage = Language.FI
export const ludosUILanguageKey = 'ludosUILanguage'
export const ludosTeachingLanguageKey = 'ludosTeachingLanguage'

export type LanguageKoodistoMap = Record<Language, Record<KoodistoName, Record<string, KoodiDtoOut>>>
export type KoodistoMap = Record<KoodistoName, Record<string, KoodiDtoOut>>
interface LudosContextValue {
  features: Features
  koodistos: LanguageKoodistoMap
  userDetails?: UserDetails
  userFavoriteAssignmentCount: number
  teachingLanguage: Language
  setTeachingLanguage: (lang: Language) => void
  uiLanguage: Language
  setUiLanguage: (lang: string) => void
}

export const defaultEmptyKoodistoMap: KoodistoMap = Object.fromEntries(
  Object.values(KoodistoName).map((name) => [name, {}])
) as unknown as KoodistoMap

const placeholderValuesNotInUse: LudosContextValue = {
  features: { tehtavaPalauteLinkki: false },
  koodistos: {
    [Language.FI]: defaultEmptyKoodistoMap,
    [Language.SV]: defaultEmptyKoodistoMap
  },
  userDetails: undefined,
  userFavoriteAssignmentCount: -1,
  teachingLanguage: Language.FI,
  setTeachingLanguage: () => {},
  uiLanguage: defaultLanguage,
  setUiLanguage: () => {}
}

export const LudosContext = createContext(placeholderValuesNotInUse)
