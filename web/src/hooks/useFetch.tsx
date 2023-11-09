import { ReactNode, useEffect, useState } from 'react'
import { fetchData } from '../request'
import { Spinner } from '../components/Spinner'
import { PageNotFound } from '../components/LudosRoutes'

export function useFetch<T>(url: string, isNew: boolean = false) {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    let isSubscribed = true
    setData(undefined)
    ;(async () => {
      if (isNew) {
        return
      }
      try {
        setLoading(true)

        const data = await fetchData<T>(url)
        if (isSubscribed) {
          setData(data)
        }
      } catch (e) {
        if (e instanceof Error) {
          const match = e.message.match(/status=(\d+)/)
          const status = match ? match[1] : 'unknown_error'
          setError(status)
        } else {
          setError('unknown_exception')
        }
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      isSubscribed = false
    }
  }, [url, refresh, isNew])

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
