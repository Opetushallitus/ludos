import { useContext } from 'react'
import { LudosContext } from '../LudosContext'
import { UserDetails } from '../types.ts'

export function useUserDetails(): UserDetails {
  const { userDetails } = useContext(LudosContext)

  return userDetails
}
