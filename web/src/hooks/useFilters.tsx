import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ContentTypesEng } from '../types'

export type FiltersType = {
  oppimaara: string[] | null
  tehtavatyyppisuko: string[] | null
  aihe: string[] | null
  tavoitetaitotaso: string[] | null
  orderDirection: 'asc' | 'desc'
  lukuvuosi: string[] | null
  aine: string[] | null
  tehtavatyyppipuhvi: string[] | null
}

export function useFilters(initialSearchFilters: string, contentType: string) {
  const location = useLocation()
  const navigate = useNavigate()

  const initialFilters: FiltersType = {
    oppimaara: null,
    tehtavatyyppisuko: null,
    aihe: null,
    tavoitetaitotaso: null,
    orderDirection: 'desc' as const,
    lukuvuosi: null,
    aine: null,
    tehtavatyyppipuhvi: null
  }

  const [filters, setFilters] = useState<FiltersType>(() => {
    const urlParams = new URLSearchParams(initialSearchFilters)

    const oppimaara = urlParams.get('oppimaara')
    const tehtavatyyppisuko = urlParams.get('tehtavatyyooisuko')
    const aihe = urlParams.get('aihe')
    const tavoitetaitotaso = urlParams.get('tavoitetaitotaso')
    const orderDirection = urlParams.get('orderDirection')
    const lukuvuosi = urlParams.get('lukuvuosi')
    const aine = urlParams.get('aine')
    const tehtavatyyppipuhvi = urlParams.get('tehtavatyyppipuhvi')

    return {
      oppimaara: oppimaara ? oppimaara.split(',') : initialFilters.oppimaara,
      tehtavatyyppisuko: tehtavatyyppisuko ? tehtavatyyppisuko.split(',') : initialFilters.tehtavatyyppisuko,
      aihe: aihe ? aihe.split(',') : initialFilters.aihe,
      tavoitetaitotaso: tavoitetaitotaso ? tavoitetaitotaso.split(',') : initialFilters.tavoitetaitotaso,
      orderDirection: orderDirection || initialFilters.orderDirection,
      lukuvuosi: lukuvuosi ? lukuvuosi.split(',') : initialFilters.lukuvuosi,
      aine: aine ? aine.split(',') : initialFilters.aine,
      tehtavatyyppipuhvi: tehtavatyyppipuhvi ? tehtavatyyppipuhvi.split(',') : initialFilters.tehtavatyyppipuhvi
    } as FiltersType
  })

  useEffect(() => {
    // only run effect on content type assignment
    if (contentType !== ContentTypesEng.KOETEHTAVAT) {
      return
    }

    const urlParams = new URLSearchParams()

    if (filters.oppimaara && filters.oppimaara.length > 0) {
      urlParams.set('oppimaara', filters.oppimaara.join(','))
    }

    if (filters.tehtavatyyppisuko && filters.tehtavatyyppisuko.length > 0) {
      urlParams.set('tehtavatyyppisuko', filters.tehtavatyyppisuko.join(','))
    }

    if (filters.aihe && filters.aihe.length > 0) {
      urlParams.set('aihe', filters.aihe.join(','))
    }

    if (filters.tavoitetaitotaso && filters.tavoitetaitotaso.length > 0) {
      urlParams.set('tavoitetaitotaso', filters.tavoitetaitotaso.join(','))
    }

    if (filters.lukuvuosi) {
      urlParams.set('lukuvuosi', filters.lukuvuosi.join(','))
    }

    if (filters.aine && filters.aine.length > 0) {
      urlParams.set('aine', filters.aine.join(','))
    }

    if (filters.tehtavatyyppipuhvi && filters.tehtavatyyppipuhvi.length > 0) {
      urlParams.set('tehtavatyyppipuhvi', filters.tehtavatyyppipuhvi.join(','))
    }

    urlParams.set('orderDirection', filters.orderDirection)

    const searchString = urlParams.toString()

    navigate(
      {
        search: searchString
      },
      {
        replace: true
      }
    )
  }, [contentType, filters, location.search, navigate])

  return {
    filters,
    setFilters,
    resetFilters: () => setFilters(initialFilters)
  }
}
