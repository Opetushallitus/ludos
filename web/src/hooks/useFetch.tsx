import { useEffect, useState } from 'react'
import { fetchData, SessionExpiredFetchError } from '../request'

export function useFetch<T>(url: string, shouldNotFetch: boolean = false) {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
            const match = e.message.match(/status=(\d+)/)
            const status = match ? match[1] : ''
            setError(status)
          } else {
            setError('')
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
