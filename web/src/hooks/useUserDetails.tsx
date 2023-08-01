import { useContext } from 'react'
import { LudosContext } from '../LudosContext'
import { Roles } from '../types'

export function useUserDetails() {
  const { userDetails } = useContext(LudosContext)

  const isOpettaja = userDetails?.role === Roles.OPETTAJA
  const isYllapitaja = userDetails?.role === Roles.YLLAPITAJA
  const isLaatija = userDetails?.role === Roles.LAATIJA

  return {
    firstNames: userDetails?.firstNames || null,
    lastName: userDetails?.lastName || null,
    role: userDetails?.role,
    isOpettaja,
    isYllapitaja,
    isLaatija
  }
}
