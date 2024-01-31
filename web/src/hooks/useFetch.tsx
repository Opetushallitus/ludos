import { useEffect, useState } from 'react'
import { fetchData, SessionExpiredFetchError } from '../request'

export function useFetch<T>(url: string, shouldNotFetch: boolean = false) {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    let isSubscribed = true
    setData(undefined)
    ;(async () => {
      if (shouldNotFetch) {
        return
      }
      try {
        setLoading(true)

        const data = await fetchData<T>(url)
        if (isSubscribed) {
          setData(data)
          setError(null)
        }
      } catch (e) {
        if (isSubscribed) {
          setData(undefined)
          if (e instanceof SessionExpiredFetchError) {
            location.reload()
            throw SessionExpiredFetchError
          } else if (e instanceof Error) {
            setError(e)
          } else {
            setError(new Error(`Unexpected error type ${typeof e}: ${e}}`))
          }
        }
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      isSubscribed = false
    }
  }, [url, refresh, shouldNotFetch])

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
