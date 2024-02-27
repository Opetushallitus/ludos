import { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  defaultEmptyKoodistoMap,
  defaultLanguage,
  LanguageKoodistoMap,
  LudosContext,
  ludosTeachingLanguageKey,
  ludosUILanguageKey
} from './LudosContext'
import { BusinessLanguage, Language, Roles, UserDetails } from '../types'
import { getKoodistos, getUserDetails, getUserFavoriteCount } from '../request'

const unauthorizedUserDetails: UserDetails = {
  role: Roles.UNAUTHORIZED,
  firstNames: null,
  lastName: null,
  businessLanguage: null
}

type LudosContextProviderProps = {
  children: ReactNode
}

export const LudosContextProvider = ({ children }: LudosContextProviderProps) => {
  const { i18n } = useTranslation()
  const [koodistos, setKoodistos] = useState<LanguageKoodistoMap>({
    FI: defaultEmptyKoodistoMap,
    SV: defaultEmptyKoodistoMap
  })
  const [userDetails, setUserDetails] = useState<UserDetails | undefined>()
  const [userFavoriteAssignmentCount, setUserFavoriteAssignmentCount] = useState<number>(-1)
  const [teachingLanguage, setTeachingLanguageState] = useState<Language>(
    (localStorage.getItem(ludosTeachingLanguageKey)?.toUpperCase() as Language) || Language.FI
  )

  const setTeachingLanguage = (lang: Language) => {
    setTeachingLanguageState(lang)
    localStorage.setItem(ludosTeachingLanguageKey, lang)
  }

  const setUILanguage = (lang: string) => {
    void i18n.changeLanguage(lang)
    localStorage.setItem(ludosUILanguageKey, lang)
  }

  useEffect(() => {
    const fetchFavoriteCount = async () => {
      try {
        const userFavoriteAssignmentCountResponse = await getUserFavoriteCount()

        if (userFavoriteAssignmentCountResponse.ok) {
          setUserFavoriteAssignmentCount(await userFavoriteAssignmentCountResponse.json())
        } else {
          console.error('Could not fetch userFavoriteAssignmentCount')
        }
      } catch (e) {
        console.error('Error occurred while fetching userFavoriteAssignmentCount:', e)
      }
    }

    const fetchUserDetails = async () => {
      try {
        const userDetailsResponse = await getUserDetails()

        if (userDetailsResponse.status === 401) {
          setUserDetails(unauthorizedUserDetails)
        } else if (userDetailsResponse.ok) {
          const userDetailsJson: UserDetails = await userDetailsResponse.json()

          // set businessLanguage to localStorage if it is not set beforehand
          const validBusinessLanguageOrDefault =
            userDetailsJson.businessLanguage === BusinessLanguage.fi ||
            userDetailsJson.businessLanguage === BusinessLanguage.sv
              ? (userDetailsJson.businessLanguage as 'fi' | 'sv')
              : defaultLanguage

          if (!localStorage.getItem(ludosUILanguageKey)) {
            void i18n.changeLanguage(validBusinessLanguageOrDefault)
          }

          // for first time users set teaching language to be the same as business language
          if (!localStorage.getItem(ludosTeachingLanguageKey)) {
            setTeachingLanguageState(validBusinessLanguageOrDefault.toUpperCase() as Language)
          }

          setUserDetails(userDetailsJson)
        } else {
          console.error('Could not fetch userDetails')
        }
      } catch (e) {
        console.error('Error occurred while fetching userDetails:', e)
      }
    }

    void fetchUserDetails()
    void fetchFavoriteCount()
  }, [i18n])

  useEffect(() => {
    const fetchKoodistos = async () => {
      try {
        const koodistosResponse = await getKoodistos()

        if (koodistosResponse.ok) {
          setKoodistos(await koodistosResponse.json())
        } else {
          console.error('Could not fetch koodistos')
        }
      } catch (e) {
        console.error('Error occurred while fetching koodistos:', e)
      }
    }

    void fetchKoodistos()
  }, [i18n.language])

  return (
    <LudosContext.Provider
      value={{
        koodistos,
        setKoodistos,
        userDetails,
        setUserDetails,
        userFavoriteAssignmentCount,
        setUserFavoriteAssignmentCount,
        teachingLanguage,
        setTeachingLanguage,
        uiLanguage: i18n.language,
        setUiLanguage: setUILanguage
      }}>
      {children}
    </LudosContext.Provider>
  )
}
