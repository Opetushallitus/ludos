import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ContentTypeEng } from '../types'

function isOrderDirection(value: any): value is 'asc' | 'desc' {
  return value === 'asc' || value === 'desc'
}

export type FiltersType = {
  oppimaara: string[] | null
  tehtavatyyppisuko: string[] | null
  aihe: string[] | null
  tavoitetaitotaso: string[] | null
  orderDirection: 'asc' | 'desc'
  lukuvuosi: string[] | null
  aine: string[] | null
  tehtavatyyppipuhvi: string[] | null
  isFavorite: boolean | null
}

export function useFilters({
  initialSearchFilters,
  contentType,
  basePath,
  showOnlyFavorites
}: {
  initialSearchFilters: string
  contentType: string
  basePath?: string
  showOnlyFavorites?: boolean
}) {
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
    tehtavatyyppipuhvi: null,
    isFavorite: showOnlyFavorites ? true : null
  }

  const [filters, setFilters] = useState<FiltersType>(() => {
    const urlParams = new URLSearchParams(initialSearchFilters)

    const oppimaara = urlParams.get('oppimaara')
    const tehtavatyyppisuko = urlParams.get('tehtavatyyppisuko')
    const aihe = urlParams.get('aihe')
    const tavoitetaitotaso = urlParams.get('tavoitetaitotaso')
    const orderDirection = urlParams.get('orderDirection')
    const lukuvuosi = urlParams.get('lukuvuosi')
    const aine = urlParams.get('aine')
    const tehtavatyyppipuhvi = urlParams.get('tehtavatyyppipuhvi')
    const isFavorite = urlParams.get('isFavorite')

    return {
      oppimaara: oppimaara ? oppimaara.split(',') : initialFilters.oppimaara,
      tehtavatyyppisuko: tehtavatyyppisuko ? tehtavatyyppisuko.split(',') : initialFilters.tehtavatyyppisuko,
      aihe: aihe ? aihe.split(',') : initialFilters.aihe,
      tavoitetaitotaso: tavoitetaitotaso ? tavoitetaitotaso.split(',') : initialFilters.tavoitetaitotaso,
      orderDirection: isOrderDirection(orderDirection) ? orderDirection : initialFilters.orderDirection,
      lukuvuosi: lukuvuosi ? lukuvuosi.split(',') : initialFilters.lukuvuosi,
      aine: aine ? aine.split(',') : initialFilters.aine,
      tehtavatyyppipuhvi: tehtavatyyppipuhvi ? tehtavatyyppipuhvi.split(',') : initialFilters.tehtavatyyppipuhvi,
      isFavorite: isFavorite ? isFavorite === 'true' : initialFilters.isFavorite
    }
  })

  // reset filters and URL search params
  const resetFiltersAndParams = useCallback(() => {
    // Resetting filters to initial state
    setFilters(initialFilters)

    // Resetting URL search params
    const newURLParams = new URLSearchParams()
    newURLParams.set('orderDirection', initialFilters.orderDirection)

    if (showOnlyFavorites) {
      newURLParams.set('isFavorite', true.toString())
    }

    const newSearchString = newURLParams.toString()
    navigate(
      {
        pathname: basePath || '',
        search: newSearchString
      },
      {
        replace: true
      }
    )
    // This effect should only run once, when the function call is made
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // only run effect on content type assignment and instruction
    if (contentType === ContentTypeEng.TODISTUKSET) {
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

    if (showOnlyFavorites) {
      urlParams.set('isFavorite', true.toString())
    }

    urlParams.set('orderDirection', filters.orderDirection)

    const searchString = urlParams.toString()

    navigate(
      {
        pathname: basePath,
        search: searchString
      },
      {
        replace: true
      }
    )
  }, [contentType, filters, location.search, navigate, showOnlyFavorites, basePath])

  return {
    filters,
    setFilters,
    resetFilters: () => setFilters(initialFilters),
    resetFiltersAndParams
  }
}
