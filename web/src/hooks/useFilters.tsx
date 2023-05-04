import { useState } from 'react'

export type FiltersType = {
  course: string | null
  assignmentType: string | null
  topic: string | null
  orderBy: 'assignment_created_at'
  orderDirection: 'asc' | 'desc'
}

export function useFilters() {
  const [filters, setFilters] = useState<FiltersType>({
    course: null,
    assignmentType: null,
    topic: null,
    orderBy: 'assignment_created_at',
    orderDirection: 'desc'
  })

  return { filters, setFilters }
}
