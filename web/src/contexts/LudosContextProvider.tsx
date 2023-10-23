import { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  defaultEmptyKoodistoMap,
  defaultLanguage,
  KoodistoMap,
  LudosContext,
  ludosTeachingLanguageKey,
  ludosUILanguageKey
} from './LudosContext'
import { BusinessLanguage, Roles, TeachingLanguage, UserDetails } from '../types'
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
  const [koodistos, setKoodistos] = useState<KoodistoMap>(defaultEmptyKoodistoMap)
  const [userDetails, setUserDetails] = useState<UserDetails | undefined>()
  const [userFavoriteAssignmentCount, setUserFavoriteAssignmentCount] = useState<number>(-1)
  const [teachingLanguage, setTeachingLanguageState] = useState<TeachingLanguage>(
    (localStorage.getItem(ludosTeachingLanguageKey) as TeachingLanguage | null) || defaultLanguage
  )

  const setTeachingLanguage = (lang: TeachingLanguage) => {
    setTeachingLanguageState(lang)
    localStorage.setItem(ludosTeachingLanguageKey, lang)
  }

  const setUILanguage = (lang: string) => {
    void i18n.changeLanguage(lang)
    localStorage.setItem(ludosUILanguageKey, lang)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userDetailsResponse, userFavoriteAssignmentCountResponse, koodistosResponse] = await Promise.all([
          getUserDetails(),
          getUserFavoriteCount(),
          i18n.language !== 'keys' && getKoodistos(i18n.language.toUpperCase())
        ])

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
            setTeachingLanguageState(validBusinessLanguageOrDefault)
          }

          setUserDetails(userDetailsJson)
        } else {
          console.error('Could not fetch userDetails')
        }

        if (koodistosResponse && koodistosResponse.ok) {
          setKoodistos(await koodistosResponse.json())
        } else {
          console.error('Could not fetch koodistos')
        }

        if (userFavoriteAssignmentCountResponse.ok) {
          setUserFavoriteAssignmentCount(await userFavoriteAssignmentCountResponse.json())
        } else {
          console.error('Could not fetch userFavoriteAssignmentCount')
        }
      } catch (e) {
        console.error('Error occurred while fetching data:', e)
      }
    }

    void fetchData()
  }, [i18n])

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
