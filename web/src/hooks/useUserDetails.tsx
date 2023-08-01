import { useContext } from 'react'
import { LudosContext } from '../LudosContext'
import { UserDetails } from '../types'

export function useUserDetails(): UserDetails {
  const { userDetails } = useContext(LudosContext)

  return {
    firstNames: userDetails?.firstNames || null,
    lastName: userDetails?.lastName || null,
    role: userDetails?.role || null
  }
}
