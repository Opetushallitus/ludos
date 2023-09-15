import { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { defaultEmptyKoodistoMap, KoodistoMap, LudosContext } from '../LudosContext'
import { Roles, UserDetails } from '../types'
import { getKoodistos, getUserDetails, getUserFavoriteCount } from '../request'

type LudosContextProviderProps = {
  children: ReactNode
}

export const LudosContextProvider = ({ children }: LudosContextProviderProps) => {
  const { i18n } = useTranslation()
  const [koodistos, setKoodistos] = useState<KoodistoMap>(defaultEmptyKoodistoMap)
  const [userDetails, setUserDetails] = useState<UserDetails | undefined>()
  const [userFavoriteAssignmentCount, setUserFavoriteAssignmentCount] = useState<number>(-1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [koodistosResponse, userDetailsResponse, userFavoriteAssignmentCountResponse] = await Promise.all([
          getKoodistos(i18n.language.toUpperCase()),
          getUserDetails(),
          getUserFavoriteCount()
        ])

        if (userDetailsResponse.status === 401) {
          setUserDetails({ role: Roles.UNAUTHORIZED, firstNames: '', lastName: '' })
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

        if (koodistosResponse.ok) {
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
  }, [i18n.language])

  return (
    <LudosContext.Provider
      value={{
        koodistos: koodistos,
        setKoodistos,
        userDetails,
        setUserDetails,
        userFavoriteAssignmentCount: userFavoriteAssignmentCount,
        setUserFavoriteAssignmentCount: setUserFavoriteAssignmentCount
      }}>
      {children}
    </LudosContext.Provider>
  )
}
