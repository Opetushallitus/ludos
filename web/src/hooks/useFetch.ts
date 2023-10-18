import { useEffect, useState } from 'react'
import { fetchData } from '../request'

export function useFetch<T>(url: string, isNew: boolean = false) {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (isNew) {
        return
      }
      setData(undefined)
      try {
        setLoading(true)

        const data = await fetchData<T>(url)
        setData(data)
      } catch (e) {
        console.error('Error fetching data', e)
        setError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [url, refresh, isNew])

  return {
    data,
    loading,
    error,
    refresh: () => {
      setData(undefined)
      setRefresh(!refresh)
      setError(false)
    }
  }
}
