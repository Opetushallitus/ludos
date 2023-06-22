import { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { defaultEmptyKoodistoMap, LudosContext, KoodistoMap } from '../LudosContext'
import { UserDetails } from '../types'

export const LudosContextProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation()
  const [koodistos, setKoodistos] = useState<KoodistoMap>(defaultEmptyKoodistoMap)
  const [userDetails, setUserDetails] = useState<UserDetails>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [koodistosResponse, userDetailsResponse] = await Promise.all([
          fetch(`/api/koodisto/${i18n.language.toUpperCase()}`, { method: 'GET' }),
          fetch(`/api/auth/user`, { method: 'GET' })
        ])

        if (koodistosResponse.ok) {
          const koodistosJson = await koodistosResponse.json()
          setKoodistos(koodistosJson)
        } else {
          console.error('Could not fetch koodistos')
        }

        if (userDetailsResponse.status === 401) {
          setUserDetails({ role: 'UNAUTHORIZED', name: '' })
        } else if (userDetailsResponse.ok) {
          const userDetailsJson = await userDetailsResponse.json()
          setUserDetails(userDetailsJson)
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
