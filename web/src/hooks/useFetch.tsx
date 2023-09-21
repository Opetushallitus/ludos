import { useEffect, useState } from 'react'

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
      try {
        setLoading(true)

        const response = await fetch(`/api/${url}`, { method: 'GET', redirect: 'error' })

        if (!response.ok) {
          setError(true)
          return
        }

        const json = await response.json()

        setData(json)
      } catch (e) {
        console.log('Error fetching data', e)
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
