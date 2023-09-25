import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Exam } from '../types'

export type FiltersType = {
  oppimaara: string[] | null
  tehtavatyyppisuko: string[] | null
  aihe: string[] | null
  tavoitetaitotaso: string[] | null
  jarjesta: 'asc' | 'desc'
  lukuvuosi: string[] | null
  aine: string[] | null
  tehtavatyyppipuhvi: string[] | null
  suosikki: boolean | null
}

export type ParamsValue = string | string[] | null | boolean

export function useFilterValues(exam: Exam, showOnlyFavorites?: boolean) {
  const navigate = useNavigate()
  const location = useLocation()

  const filterValues = useMemo((): FiltersType => {
    const examKeyMap: Record<Exam, (keyof FiltersType)[]> = {
      [Exam.LD]: ['aine', 'lukuvuosi'],
      [Exam.PUHVI]: ['tehtavatyyppipuhvi', 'lukuvuosi'],
      [Exam.SUKO]: ['oppimaara', 'aihe', 'tavoitetaitotaso', 'tehtavatyyppisuko']
    }

    const urlParams = new URLSearchParams(location.search)

    const currentParams: FiltersType = {
      oppimaara: null,
      tehtavatyyppisuko: null,
      aihe: null,
      tavoitetaitotaso: null,
      jarjesta: 'desc' as const,
      lukuvuosi: null,
      aine: null,
      tehtavatyyppipuhvi: null,
      suosikki: showOnlyFavorites ? true : null
    }

    urlParams.forEach((value, stringKey) => {
      const key: keyof FiltersType = stringKey as keyof FiltersType
      if (key === 'suosikki') {
        currentParams[key] = value === 'true'
      } else if (key === 'jarjesta') {
        currentParams[key] = value === 'asc' ? 'asc' : 'desc'
      } else if (examKeyMap[exam]?.includes(key)) {
        currentParams[key] = value.split(',')
      }
    })

    return currentParams
  }, [exam, location.search, showOnlyFavorites])

  const setFilterValue = (key: keyof FiltersType, value: ParamsValue) => {
    const urlParams = new URLSearchParams(location.search)
    if (value === null) {
      urlParams.delete(key)
    } else {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          urlParams.delete(key)
        } else {
          urlParams.set(key, value.join(','))
        }
      } else if (typeof value === 'boolean') {
        urlParams.set(key, value.toString())
      } else {
        urlParams.set(key, value)
      }
    }
    navigate({ search: `?${urlParams.toString()}` }, { replace: true })
  }

  return { filterValues, setFilterValue }
}
