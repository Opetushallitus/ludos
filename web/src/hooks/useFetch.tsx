import { useEffect, useState } from 'react'

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        const response = await fetch(`/api/${url}`, { method: 'GET' })

        if (!response.ok) {
          throw new Error('could not fetch tasks')
        }

        const json = await response.json()

        setData(json)
      } catch (e) {
        setError('error')
        console.error('could not fetch tasks', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [url, refresh])

  return {
    data,
    loading,
    error,
    refresh: () => {
      setData(undefined)
      setRefresh(!refresh)
      setError(null)
    }
  }
}
