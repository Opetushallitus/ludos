import { useContext } from 'react'
import { LudosContext } from '../LudosContext'

export function useUserDetails() {
  const { userDetails } = useContext(LudosContext)

  return {
    name: userDetails?.name,
    role: userDetails?.role
  }
}
