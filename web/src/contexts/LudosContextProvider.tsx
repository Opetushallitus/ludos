import { useQuery } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useSetLanguagesBasedOnUserDetails } from '../hooks/useSetLanguagesBasedOnUserDetails'
import { getFeatures, getKoodistos, getUserDetailsRequest, getUserFavoriteCount } from '../request'
import { Roles, UserDetails } from '../types'
import { defaultEmptyKoodistoMap, LudosContext } from './LudosContext'

export const FAVORITE_COUNT_QUERY_KEY = ['favoriteAssignmentCount']

const unauthorizedUserDetails: UserDetails = {
  role: Roles.UNAUTHORIZED,
  firstNames: null,
  lastName: null,
  businessLanguage: null
}

async function getUserDetails() {
  try {
    const userDetailsResponse = await getUserDetailsRequest()
    if (userDetailsResponse.status === 401) {
      return unauthorizedUserDetails
    } else if (userDetailsResponse.ok) {
      return await userDetailsResponse.json()
    }
  } catch (e) {
    console.error('Error occurred while fetching userDetails:', e)
  }
}

type LudosContextProviderProps = {
  children: ReactNode
}

export const LudosContextProvider = ({ children }: LudosContextProviderProps) => {
  const { data: userFavoriteAssignmentCount } = useQuery({
    queryKey: FAVORITE_COUNT_QUERY_KEY,
    queryFn: getUserFavoriteCount,
    initialData: -1
  })

  const { data: userDetails, isSuccess } = useQuery({
    queryKey: ['userDetails'],
    queryFn: getUserDetails
  })

  const { data: features } = useQuery({
    queryKey: ['features'],
    queryFn: getFeatures,
    initialData: {}
  })

  const { teachingLanguage, setTeachingLanguage, uiLanguage, setUiLanguage } = useSetLanguagesBasedOnUserDetails(
    userDetails,
    isSuccess
  )

  const { data: koodistos } = useQuery({
    queryKey: ['koodistos'],
    queryFn: getKoodistos,
    initialData: {
      FI: defaultEmptyKoodistoMap,
      SV: defaultEmptyKoodistoMap
    }
  })

  return (
    <LudosContext.Provider
      value={{
        features,
        koodistos,
        userDetails,
        userFavoriteAssignmentCount,
        teachingLanguage,
        setTeachingLanguage,
        uiLanguage,
        setUiLanguage
      }}
    >
      {children}
    </LudosContext.Provider>
  )
}
