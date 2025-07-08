import { useEffect, useState } from 'react'
import { defaultLanguage, ludosTeachingLanguageKey, ludosUILanguageKey } from '../contexts/LudosContext'
import { BusinessLanguage, Language, UserDetails } from '../types'
import { useLudosTranslation } from './useLudosTranslation'

export function useSetLanguagesBasedOnUserDetails(userDetails: UserDetails, isSuccess: boolean) {
  const { i18n } = useLudosTranslation()
  const [teachingLanguage, setTeachingLanguageState] = useState<Language>(
    (localStorage.getItem(ludosTeachingLanguageKey)?.toUpperCase() as Language) || Language.FI
  )

  useEffect(() => {
    if (isSuccess && userDetails) {
      const validBusinessLanguageOrDefault: Language =
        userDetails.businessLanguage === BusinessLanguage.fi || userDetails.businessLanguage === BusinessLanguage.sv
          ? (userDetails.businessLanguage.toUpperCase() as Language)
          : defaultLanguage

      if (!localStorage.getItem(ludosUILanguageKey)) {
        localStorage.setItem(ludosUILanguageKey, validBusinessLanguageOrDefault)
        void i18n.changeLanguage(validBusinessLanguageOrDefault)
      }

      if (!localStorage.getItem(ludosTeachingLanguageKey)) {
        setTeachingLanguageState(validBusinessLanguageOrDefault)
        localStorage.setItem(ludosTeachingLanguageKey, validBusinessLanguageOrDefault)
      }
    }
  }, [userDetails, isSuccess, i18n])

  const setTeachingLanguage = (lang: Language) => {
    setTeachingLanguageState(lang)
    localStorage.setItem(ludosTeachingLanguageKey, lang)
  }

  const setUiLanguage = (lang: string) => {
    void i18n.changeLanguage(lang)
    localStorage.setItem(ludosUILanguageKey, lang)
  }

  return {
    teachingLanguage,
    setTeachingLanguage,
    uiLanguage: i18n.language === Language.FI || i18n.language === Language.SV ? i18n.language : defaultLanguage,
    setUiLanguage
  }
}
