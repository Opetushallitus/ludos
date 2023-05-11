import { useState } from 'react'

export type FiltersType = {
  oppimaara: string | null
  assignmentTypeKoodiArvo: string | null
  aihe: string | null
  orderBy: 'assignment_created_at'
  orderDirection: 'asc' | 'desc'
}

export function useFilters() {
  const [filters, setFilters] = useState<FiltersType>({
    oppimaara: null,
    assignmentTypeKoodiArvo: null,
    aihe: null,
    orderBy: 'assignment_created_at',
    orderDirection: 'desc'
  })

  return { filters, setFilters }
}
