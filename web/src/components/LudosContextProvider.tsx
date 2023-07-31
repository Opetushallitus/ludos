import { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { defaultEmptyKoodistoMap, LudosContext, KoodistoMap } from '../LudosContext'
import { UserDetails } from '../types'
import { Role } from 'playwright/helpers.ts'
import { getKoodistos, getUserDetails } from '../request.ts'

type LudosContextProviderProps = {
  children: ReactNode
}

export const LudosContextProvider = ({ children }: LudosContextProviderProps) => {
  const { i18n } = useTranslation()
  const [koodistos, setKoodistos] = useState<KoodistoMap>(defaultEmptyKoodistoMap)
  const [userDetails, setUserDetails] = useState<UserDetails | undefined>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [koodistosResponse, userDetailsResponse] = await Promise.all([
          getKoodistos(i18n.language.toUpperCase()),
          getUserDetails()
        ])

        if (koodistosResponse.ok) {
          const koodistosJson = await koodistosResponse.json()
          setKoodistos(koodistosJson)
        } else {
          console.error('Could not fetch koodistos')
        }

        if (userDetailsResponse.status === 401) {
          setUserDetails({ role: Role.UNAUTHORIZED, name: '' })
        } else if (userDetailsResponse.ok) {
          const userDetailsJson: UserDetails = await userDetailsResponse.json()
          setUserDetails({
            firstNames: userDetailsJson.firstNames,
            lastName: userDetailsJson.lastName,
            role: userDetailsJson.role
          })
        } else {
          console.error('Could not fetch userDetails')
        }
      } catch (e) {
        console.error('Error occurred while fetching data:', e)
      }
    }

    void fetchData()
  }, [i18n.language])

  return (
    <LudosContext.Provider value={{ koodistos: koodistos, setKoodistos, userDetails, setUserDetails }}>
      {children}
    </LudosContext.Provider>
  )
}
